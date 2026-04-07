// Copyright (c) 2026 Ultra-Dex

/**
 * Interactive REPL for Ultra-Dex
 * Provides a readline-based REPL with session persistence and slash commands
 */

import readline from 'readline';
import fs from 'fs/promises';
import path from 'path';
import { homedir } from 'os';
import chalk from 'chalk';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import REPLCommands from './commands.js';
import { SessionManager } from './session.js';

const HISTORY_FILE = path.join(homedir(), '.ultra-dex', 'repl-history.json');

async function loadHistory() {
  try {
    const historyData = await fs.readFile(HISTORY_FILE, 'utf8');
    const history = JSON.parse(historyData);
    return Array.isArray(history) ? history : [];
  } catch {
    return [];
  }
}

async function saveHistory(history) {
  try {
    const dir = path.dirname(HISTORY_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(HISTORY_FILE, JSON.stringify(history.slice(-200), null, 2));
  } catch (error) {
    printWarning(chalk.yellow(`⚠️  Could not save history: ${error.message}`));
  }
}

async function loadLatestSession(sessionDir) {
  try {
    const files = await fs.readdir(sessionDir);
    const sessionFiles = files.filter((f) => f.endsWith('.json'));
    if (sessionFiles.length === 0) return null;

    const sessionStats = await Promise.all(
      sessionFiles.map(async (file) => {
        const fullPath = path.join(sessionDir, file);
        const stat = await fs.stat(fullPath);
        return { file, fullPath, mtime: stat.mtimeMs };
      })
    );

    sessionStats.sort((a, b) => b.mtime - a.mtime);
    const latest = sessionStats[0];
    const data = JSON.parse(await fs.readFile(latest.fullPath, 'utf8'));
    return data;
  } catch (error) {
    printWarning(chalk.yellow(`⚠️  Could not load latest session: ${error.message}`));
    return null;
  }
}

function createCompleter(commands) {
  const completions = new Set();
  commands.forEach((cmd) => completions.add(`/${cmd}`));
  completions.add('/exit');
  completions.add('/quit');
  completions.add('generate');
  completions.add('plan');
  completions.add('swarm');
  completions.add('run');
  completions.add('brain');
  completions.add('state');
  completions.add('context');

  return function completer(line) {
    const hits = Array.from(completions).filter((c) => c.startsWith(line));
    return [hits.length ? hits : Array.from(completions), line];
  };
}

export async function startREPL(options = {}) {
  const { continue: continueLast = false } = options;
  const sessionManager = new SessionManager();
  await sessionManager.initialize();

  const replContext = {
    history: [],
    context: {
      project: null,
      lastResult: null,
      variables: new Map(),
    },
    sessionDir: sessionManager.sessionsDir,
    sessionManager,
  };

  const replCommands = new REPLCommands(replContext);
  const commandList = Array.from(replCommands.commands.keys());

  replContext.history = await loadHistory();

  if (continueLast) {
    const latestSession = await loadLatestSession(replContext.sessionDir);
    if (latestSession?.data) {
      replContext.history = latestSession.data.history || replContext.history;
      replContext.context = latestSession.data.context || replContext.context;
      replContext.context.variables = new Map(Object.entries(latestSession.data.variables || {}));
      printSuccess(chalk.green(`✅ Resumed session: ${latestSession.name || latestSession.id}`));
    }
  }

  printInfo(chalk.cyan.bold('\n⚡ Ultra-Dex Interactive REPL\n'));
  printInfo(chalk.gray('Type /help for commands. Use """ to start multi-line input.'));
  printInfo(chalk.gray('Use /save <name> to persist sessions. Ctrl+C to cancel input.\n'));

  let multiLineBuffer = null;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.blue('ultra-dex> '),
    completer: createCompleter(commandList),
  });

  if (replContext.history.length > 0) {
    rl.history = [...replContext.history].reverse();
  }

  const handleSlashCommand = async (input) => {
    const [commandName, ...args] = input.slice(1).trim().split(/\s+/);
    if (!commandName) return;

    if (commandName === 'exit' || commandName === 'quit') {
      rl.close();
      return;
    }

    const handler = replCommands.commands.get(commandName);
    if (!handler) {
      printError(
        chalk.red(`❌ Unknown command: /${commandName}. Use /help for available commands.`)
      );
      return;
    }

    await handler(args);
  };

  rl.on('line', async (line) => {
    let input = line.trimEnd();

    if (input === '"""' && multiLineBuffer === null) {
      multiLineBuffer = '';
      rl.setPrompt(chalk.blue('... '));
      rl.prompt();
      return;
    }

    if (multiLineBuffer !== null) {
      if (input.includes('"""')) {
        const [before] = input.split('"""');
        multiLineBuffer += before;
        input = multiLineBuffer;
        multiLineBuffer = null;
        rl.setPrompt(chalk.blue('ultra-dex> '));
      } else {
        multiLineBuffer += `${line}\n`;
        rl.prompt();
        return;
      }
    }

    if (!input.trim()) {
      rl.prompt();
      return;
    }

    replContext.history.push(input.trim());
    await saveHistory(replContext.history);

    if (input.startsWith('/')) {
      await handleSlashCommand(input);
    } else {
      // NLP Intent Routing Hook - Process natural language input
      try {
        const { 
          routeIntentWithContext, 
          extractParams, 
          getIntentConfidence, 
          needsClarification,
          getContextualSuggestions,
          conversationHistory 
        } = await import('../nlp/router.js');
        
        const intent = routeIntentWithContext(input);
        
        if (intent) {
          const params = extractParams(intent, input);
          const { confidence, matchType, alternatives } = getIntentConfidence(input);
          
          // Check if clarification is needed
          const clarification = needsClarification(input, 0.6);
          
          if (clarification.needsClarification) {
            // Multi-turn clarification dialog
            console.log(chalk.yellow(`\n🤔 ${clarification.clarificationQuestion}`));
            console.log(chalk.gray('   (or type the command number to select)\n'));
          }
          
          // High confidence: auto-suggest command execution
          if (confidence >= 0.8) {
            console.log(
              chalk.green('✓ Detected intent:') + 
              chalk.cyan(` ultra-dex ${intent}`) +
              chalk.gray(` (confidence: ${(confidence * 100).toFixed(0)}%, match: ${matchType})`)
            );
            
            if (Object.keys(params).length > 0) {
              console.log(chalk.gray(`  Parameters: ${JSON.stringify(params)}`));
            }
            
            // Show contextual follow-up suggestions
            const followups = getContextualSuggestions();
            if (followups.length > 0) {
              console.log(chalk.gray('\n  Follow-up suggestions:'));
              followups.forEach((s, i) => {
                console.log(chalk.gray(`    ${i + 1}. ${s.description} (/${s.intent})`));
              });
            }
            
            console.log(chalk.gray(`\n  Run "ultra-dex ${intent}" to execute this command.\n`));
          } 
          // Medium confidence: show suggestion
          else if (confidence >= 0.5) {
            console.log(
              chalk.yellow('? Did you mean:') + 
              chalk.cyan(` ultra-dex ${intent}`) +
              chalk.gray(` (confidence: ${(confidence * 100).toFixed(0)}%)\n`)
            );
            
            if (alternatives.length > 0) {
              console.log(chalk.gray('  Other suggestions:'));
              alternatives.forEach((alt, i) => {
                console.log(
                  chalk.gray(`    ${i + 1}. ultra-dex ${alt.intent} (${(alt.confidence * 100).toFixed(0)}%)`)
                );
              });
              console.log();
            }
          }
          // Low confidence: show help
          else {
            console.log(
              chalk.gray('  No clear intent detected. Use /help for commands or try being more specific.\n')
            );
          }
          
          replContext.context.lastResult = { intent, params, confidence };
        } else {
          // No intent detected - show contextual suggestions
          const suggestions = getContextualSuggestions();
          if (suggestions.length > 0) {
            console.log(chalk.gray('\n  Suggestions based on context:'));
            suggestions.forEach((s, i) => {
              console.log(chalk.gray(`    ${i + 1}. ${s.description}`));
            });
            console.log();
          }
          replContext.context.lastResult = input;
        }
      } catch (_error) {
        // If NLP fails, fall back to original behavior
        replContext.context.lastResult = input;
      }
    }

    rl.prompt();
  });

  rl.on('close', () => {
    printInfo(chalk.green('\n👋 Exiting Ultra-Dex REPL'));
    process.exit(0);
  });

  rl.prompt();
  return rl;
}
