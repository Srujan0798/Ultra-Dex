// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Interface module
 * @module vibe/interface
 */

import readline from 'node:readline';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'node:crypto';
import chalk from 'chalk';
import { interpretInput, listModes } from './interpreter.js';
import { streamText } from './realtime.js';
import { HistoryManager } from '../history/undo.js';
import { printInfo, printSuccess, printWarning } from '../utils/output.js';

const SESSION_DIR = path.resolve(process.cwd(), '.ultra-dex', 'vibe');
const _SESSION_FILE = path.join(SESSION_DIR, 'session.json');

async function ensureSessionDir() {
  await fs.mkdir(SESSION_DIR, { recursive: true });
}

function renderHelp() {
  printInfo(chalk.cyan('\nVibe Mode Commands:'));
  printInfo('  /help              Show this help');
  printInfo('  /mode <mode>       Switch mode (create|modify|explain|debug)');
  printInfo('  /undo              Undo last file change');
  printInfo('  /save [name]       Save current session');
  printInfo('  /load [name]       Load saved session');
  printInfo('  /exit              Exit vibe mode');
  printInfo('\nInput tips:');
  printInfo('  - Use "in src/.." to target a file');
  printInfo('  - Multi-line: start and end with """');
  printInfo('');
}

async function loadSession(name = 'session') {
  try {
    const target = path.join(SESSION_DIR, `${name}.json`);
    const raw = await fs.readFile(target, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function saveSession(data, name = 'session') {
  await ensureSessionDir();
  const target = path.join(SESSION_DIR, `${name}.json`);
  await fs.writeFile(target, JSON.stringify(data, null, 2), 'utf8');
  return target;
}

async function applyActions(actions, history) {
  for (const action of actions) {
    if (!action?.path) continue;
    const targetPath = path.resolve(action.path);
    if (action.type === 'create') {
      const exists = await fs
        .access(targetPath)
        .then(() => true)
        .catch(() => false);
      if (!exists) {
        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        await fs.writeFile(targetPath, action.content || '', 'utf8');
        await history.recordWrite({
          filePath: targetPath,
          before: null,
          after: action.content || '',
          actor: 'vibe',
          reason: action.reason,
        });
        printSuccess(chalk.green(`Created ${path.relative(process.cwd(), targetPath)}`));
      } else {
        printWarning(chalk.yellow(`File exists: ${path.relative(process.cwd(), targetPath)}`));
      }
    }

    if (action.type === 'modify') {
      const before = await fs.readFile(targetPath, 'utf8').catch(() => '');
      const next = before + (action.content || '');
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, next, 'utf8');
      await history.recordWrite({
        filePath: targetPath,
        before,
        after: next,
        actor: 'vibe',
        reason: action.reason,
      });
      printSuccess(chalk.green(`Updated ${path.relative(process.cwd(), targetPath)}`));
    }
  }
}

async function handleIntent(intent, session, history) {
  if (intent.questions?.length) {
    intent.questions.forEach((question) => printWarning(chalk.yellow(question)));
    return;
  }

  await streamText(chalk.gray(`\n[Vibe/${intent.mode}] ${intent.summary}`));
  if (intent.actions?.length) {
    await applyActions(intent.actions, history);
  } else {
    printInfo(chalk.gray('No file actions inferred. Ask with a file path to apply changes.'));
  }

  session.history.push({ at: new Date().toISOString(), intent: intent.summary, mode: intent.mode });
}

function createReadline() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.cyan('vibe> '),
  });
}

export async function startVibeSession(options = {}) {
  await ensureSessionDir();

  const history = new HistoryManager(process.cwd());
  await history.init();

  const session = {
    id: options.sessionId || crypto.randomUUID() || `${Date.now()}`,
    mode: options.mode || 'create',
    startedAt: new Date().toISOString(),
    history: [],
  };

  const rl = createReadline();
  printInfo(chalk.cyan('\n✨ Ultra-Dex Vibe Mode'));
  printInfo(chalk.gray(`Mode: ${session.mode}`));
  printInfo(chalk.gray('Type /help for commands.'));

  rl.prompt();

  let multiLineBuffer = null;

  rl.on('line', async (line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      rl.prompt();
      return;
    }

    if (trimmed.startsWith('/')) {
      const [cmd, ...rest] = trimmed.slice(1).split(' ');
      if (cmd === 'help') {
        renderHelp();
      } else if (cmd === 'mode') {
        const nextMode = rest[0];
        if (!listModes().includes(nextMode)) {
          printWarning(chalk.yellow(`Unknown mode. Available: ${listModes().join(', ')}`));
        } else {
          session.mode = nextMode;
          printSuccess(chalk.green(`Mode switched to ${nextMode}`));
        }
      } else if (cmd === 'undo') {
        const result = await history.undo(1);
        if (result.reverted?.length) {
          printSuccess(chalk.green('Undo complete.'));
        } else {
          printWarning(chalk.yellow('Nothing to undo.'));
        }
      } else if (cmd === 'save') {
        const name = rest[0] || 'session';
        const target = await saveSession(session, name);
        printSuccess(chalk.green(`Saved session to ${path.relative(process.cwd(), target)}`));
      } else if (cmd === 'load') {
        const name = rest[0] || 'session';
        const loaded = await loadSession(name);
        if (loaded) {
          session.mode = loaded.mode || session.mode;
          session.history = loaded.history || session.history;
          printSuccess(chalk.green(`Loaded session "${name}"`));
        } else {
          printWarning(chalk.yellow(`Session "${name}" not found.`));
        }
      } else if (cmd === 'exit') {
        rl.close();
        return;
      } else {
        printWarning(chalk.yellow('Unknown command. /help for list.'));
      }

      rl.prompt();
      return;
    }

    if (multiLineBuffer) {
      if (line.includes('"""')) {
        const cleaned = line.replace('"""', '');
        if (cleaned.trim()) multiLineBuffer.push(cleaned);
        const combined = multiLineBuffer.join('\n');
        multiLineBuffer = null;
        rl.setPrompt(chalk.cyan('vibe> '));
        const intent = interpretInput(combined, { mode: session.mode, cwd: process.cwd() });
        session.mode = intent.mode || session.mode;
        await handleIntent(intent, session, history);
        rl.prompt();
        return;
      }
      multiLineBuffer.push(line);
      rl.prompt();
      return;
    }

    if (trimmed.startsWith('"""')) {
      multiLineBuffer = [];
      const cleaned = trimmed.replace('"""', '');
      if (cleaned.trim()) multiLineBuffer.push(cleaned);
      rl.setPrompt('... ');
      rl.prompt();
      return;
    }

    const intent = interpretInput(trimmed, { mode: session.mode, cwd: process.cwd() });
    session.mode = intent.mode || session.mode;

    await handleIntent(intent, session, history);

    rl.prompt();
  });

  rl.on('close', async () => {
    await saveSession(session, 'session');
    printInfo(chalk.gray('\nVibe session saved.'));
  });
}
