// Copyright (c) 2026 Ultra-Dex

/**
 * ultra-dex memory command
 * Manage persistent memory for AI agents
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import { ultraMemory } from '../mcp/memory.js';
import { memex } from '../memory/memex.js';
import { titansMemory } from '../memory/titans.js';
import { ppmManager } from '../memory/manager.js';
import { createSessionPersistence } from '../utils/sessionPersistence.js';
import { saveSession, loadSession } from '../memory/session.js';
import { savePersistent, loadPersistent } from '../memory/persistent.js';
import { getProjectRoot } from '../utils/config.js';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';

export function registerMemoryCommand(program) {
  const memory = program
    .command('memory')
    .description('Manage persistent agent memory')
    .option('--search <query>', 'Vector search across Memex')
    .option('-l, --limit <n>', 'Number of results for --search', '5')
    .action(async (options) => {
      if (!options.search) {
        memory.help();
        return;
      }

      const limit = parseInt(options.limit, 10) || 5;
      try {
        const results = await memex.search(options.search, limit);
        printInfo(chalk.cyan.bold(`\n🔍 Memex Results for "${options.search}":\n`));
        if (results.length === 0) {
          printInfo(chalk.gray('  No matches found.'));
          return;
        }

        results.forEach((item, i) => {
          const score = item.score ? item.score.toFixed(3) : '0.000';
          const agent = item.metadata?.agent || item.agent || 'unknown';
          printInfo(
            chalk.white(
              `${i + 1}. [${new Date(item.created_at).toLocaleDateString()}] (${score}) ${agent}`
            )
          );
          const snippet = (item.text || item.output || item.input || '').toString().slice(0, 160);
          if (snippet) {
            printInfo(chalk.gray(`   ${snippet}${snippet.length >= 160 ? '...' : ''}`));
          }
          printInfo('');
        });
      } catch (error) {
        printError(chalk.red(`Memex search failed: ${error.message}`));
      }
    });

  // Existing commands
  memory
    .command('list')
    .description('List all remembered facts')
    .option('--json', 'Output as JSON')
    .action(async (options) => {
      const items = await ultraMemory.getAll();

      if (options.json) {
        console.log(JSON.stringify(items, null, 2));
        return;
      }

      printInfo(chalk.cyan.bold('\n🧠 Ultra-Dex Persistent Memory\n'));

      if (items.length === 0) {
        printInfo(chalk.gray('  Memory is empty.'));
        return;
      }

      items.forEach((item, i) => {
        printInfo(
          chalk.white(
            `${i + 1}. [${new Date(item.timestamp).toLocaleDateString()}] (${item.source})`
          )
        );
        printInfo(chalk.gray(`   ${item.text}`));
        if (item.tags && item.tags.length > 0) {
          printInfo(chalk.blue(`   Tags: ${item.tags.join(', ')}`));
        }
        printInfo('');
      });
    });

  memory
    .command('add <text>')
    .description('Add a fact to memory')
    .option('-t, --tags <tags>', 'Comma-separated tags')
    .option('--memex', 'Also store in vector memory')
    .action(async (text, options) => {
      if (!text || text.trim().length === 0) {
        printError(chalk.red('Text content is required.'));
        return;
      }
      const tags = options.tags ? options.tags.split(',').map((t) => t.trim()) : [];
      await ultraMemory.remember(text, tags, 'manual');
      await ppmManager.add({
        content: text,
        type: tags.includes('decision') ? 'decision' : 'pattern',
        source: { agent: 'manual' },
        relations: tags,
      });
      if (options.memex) {
        await memex.storeItem(`memex-${Date.now()}`, text, { tags, source: 'manual' });
      }
      printSuccess(chalk.green('✅ Fact remembered.'));
    });

  memory
    .command('query <query>')
    .description('Semantic search in vector memory (Memex)')
    .option('-l, --limit <n>', 'Number of results', '5')
    .action(async (query, options) => {
      try {
        const limit = parseInt(options.limit, 10) || 5;
        const results = await memex.search(query, limit);
        printInfo(chalk.cyan.bold(`\n🔍 Memex Query Results for "${query}":\n`));
        if (results.length === 0) {
          printInfo(chalk.gray('  No matches found.'));
          return;
        }

        results.forEach((item, i) => {
          const score = item.score ? item.score.toFixed(3) : '0.000';
          const agent = item.metadata?.agent || 'unknown';
          printInfo(chalk.white(`${i + 1}. (${score}) ${agent}`));
          const snippet = (item.text || '').toString().slice(0, 160);
          if (snippet) {
            printInfo(chalk.gray(`   ${snippet}${snippet.length >= 160 ? '...' : ''}`));
          }
          printInfo('');
        });
      } catch (error) {
        printError(chalk.red(`Memex query failed: ${error.message}`));
      }
    });

  memory
    .command('search <query>')
    .description('Search memory')
    .action(async (query) => {
      if (!query || query.trim().length === 0) {
        printError(chalk.red('Search query is required.'));
        return;
      }
      const results = await ppmManager.search(query, 5);
      printInfo(chalk.cyan.bold(`\n🔍 Search Results for "${query}":\n`));

      if (results.length === 0) {
        printInfo(chalk.gray('  No matches found.'));
        return;
      }

      results.forEach((item, i) => {
        const ts = item.timestamp || item.created_at || new Date().toISOString();
        printInfo(chalk.white(`${i + 1}. [${new Date(ts).toLocaleDateString()}]`));
        printInfo(chalk.gray(`   ${item.content || item.text || ''}`));
        printInfo('');
      });
    });

  memory
    .command('clear')
    .description('Clear all memory')
    .option('--before <date>', 'Clear before date (ISO)')
    .option('--memex', 'Clear vector memory (Memex)')
    .option('--all', 'Clear both standard memory and Memex')
    .action(async (options) => {
      if (options.before) {
        const date = new Date(options.before);
        if (isNaN(date.getTime())) {
          printError(chalk.red('Invalid date format. Use ISO format (e.g. 2023-01-01).'));
          return;
        }
      }
      if (options.all || !options.memex) {
        await ultraMemory.clear(options.before);
      }
      if (options.all || options.memex) {
        await memex.deleteAfter(options.before || new Date(0).toISOString());
      }
      printSuccess(chalk.green('✅ Memory cleared.'));
    });

  memory
    .command('save')
    .description('Save current session memory snapshot')
    .action(async () => {
      const snapshot = {
        timestamp: new Date().toISOString(),
        context: await createSessionPersistence(getProjectRoot()),
      };
      const location = await saveSession(snapshot);
      await savePersistent(snapshot);
      printSuccess(chalk.green(`✅ Session memory saved to ${location}`));
    });

  memory
    .command('restore')
    .description('Restore last session memory snapshot')
    .action(async () => {
      try {
        const snapshot = await loadSession();
        printInfo(chalk.cyan('\n✅ Restored session snapshot:\n'));
        printInfo(JSON.stringify(snapshot, null, 2));
      } catch (error) {
        printError(chalk.red(`Restore failed: ${error.message}`));
      }
    });

  memory
    .command('sync')
    .description('Sync session memory to persistent store')
    .action(async () => {
      try {
        const snapshot = await loadSession();
        await savePersistent(snapshot);
        printSuccess(chalk.green('✅ Session memory synced.'));
      } catch (error) {
        printError(chalk.red(`Sync failed: ${error.message}`));
      }
    });

  memory
    .command('tier <tier>')
    .description('Show memory tier (hot|warm|cold)')
    .action(async (tier) => {
      const entries = await ppmManager.getTier(tier);
      printInfo(chalk.cyan(`\n${tier.toUpperCase()} memory (${entries.length})\n`));
      entries.slice(0, 10).forEach((entry) => {
        printInfo(chalk.gray(`- ${entry.summary || entry.content?.slice(0, 120) || ''}`));
      });
    });

  memory
    .command('why <query>')
    .description('Explain why a decision was made (cold tier)')
    .action(async (query) => {
      const entries = await ppmManager.why(query);
      if (!entries.length) {
        printWarning(chalk.yellow('\nNo related decisions found.\n'));
        return;
      }
      printInfo(chalk.cyan(`\nWhy "${query}"\n`));
      entries.forEach((entry) => {
        printInfo(chalk.white(`- ${entry.content}`));
      });
    });

  memory
    .command('consolidate')
    .description('Consolidate warm memory into cold')
    .action(async () => {
      await titansMemory.consolidate();
      printSuccess(chalk.green('\n✅ Memory consolidated.\n'));
    });

  memory
    .command('stats')
    .alias('status') // Alias for status
    .description('Show memory statistics')
    .option('--visual', 'Show visual progress bar')
    .action(async (options) => {
      const state = await titansMemory.stats(); // Gets base stats

      // v4.0.1: Stats logic
      if (options.visual) {
        // Dynamic imports to save startup time
        const { configManager } = await import('../utils/config-manager.js');
        const { default: terminalLink } = await import('terminal-link');

        const config = configManager.getConfig();
        const maxTokens = config.memory?.maxContextTokens || 8192;

        // Helper to estimate current tokens (Hot tier)
        // In a real implementation this would come from the state, 
        // but for v4.0.1 we estimate based on item count * avg
        const estimatedTokens = state.hot * 150; // Avg 150 tokens per turn
        const percent = Math.min(100, Math.round((estimatedTokens / maxTokens) * 100));

        // Create the bar manually since we don't want a heavy deps for just this
        const width = 40;
        const filled = Math.round((width * percent) / 100);
        const empty = width - filled;

        const barColor = percent > 80 ? chalk.red : (percent > 50 ? chalk.yellow : chalk.green);
        const bar = barColor('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));

        printInfo(chalk.cyan.bold('\n🧠 Memory Context Window\n'));
        printInfo(`Usage: ${bar} ${percent}%`);
        printInfo(chalk.gray(`       ${estimatedTokens} / ${maxTokens} tokens (est)\n`));

        if (percent > 80) {
          printWarning(chalk.yellow('⚠️  Token Limit Approaching. Auto-Prune pending.'));
        }

        printInfo('');
        return;
      }

      // Default stats output
      printInfo(chalk.cyan('\nMemory Stats\n'));
      printInfo(`Hot: ${state.hot}`);
      printInfo(`Warm: ${state.warm}`);
      printInfo(`Cold: ${state.cold}`);
    });

  // NEW: Session persistence commands
  memory
    .command('sessions')
    .description('List all persistent sessions')
    .action(async () => {
      try {
        const projectRoot = getProjectRoot();
        const persistence = createSessionPersistence(projectRoot);
        await persistence.init();

        const sessions = await persistence.db.all(
          'SELECT * FROM sessions ORDER BY created_at DESC'
        );

        if (sessions.length === 0) {
          printWarning(chalk.yellow('\n📁 No sessions found.\n'));
          printInfo(chalk.gray('Start a swarm to create a session.'));
          return;
        }

        printInfo(chalk.cyan.bold('\n📁 Persistent Sessions:\n'));

        for (const session of sessions) {
          const stats = await persistence.getDecisionStats(session.id);

          printInfo(chalk.white(`${session.name}`));
          printInfo(chalk.gray(`   ID: ${session.id}`));
          printInfo(chalk.gray(`   Created: ${new Date(session.created_at).toLocaleString()}`));
          printInfo(
            chalk.gray(`   Decisions: ${stats.total_decisions} by ${stats.unique_agents} agents`)
          );
          printInfo('');
        }

        await persistence.close();
      } catch (error) {
        printError(chalk.red('Error:'), error.message);
      }
    });

  memory
    .command('decisions [sessionId]')
    .description('Show decisions for a session')
    .option('-l, --limit <n>', 'Number of results', '20')
    .action(async (sessionId, options) => {
      try {
        const projectRoot = getProjectRoot();
        const persistence = createSessionPersistence(projectRoot);
        await persistence.init();

        if (!sessionId) {
          printWarning(chalk.yellow('No session ID provided.'));
          printInfo(chalk.gray('Use `memory sessions` to list available sessions.'));
          return;
        }

        printInfo(chalk.cyan(`\n📋 Decisions for session ${sessionId}\n`));

        const results = await persistence.getRecentDecisions(sessionId, parseInt(options.limit));

        if (results.length === 0) {
          printWarning(chalk.yellow('No decisions found for this session.'));
          return;
        }

        results.forEach((r, i) => {
          printInfo(
            chalk.white(`${i + 1}. [${new Date(r.created_at).toLocaleTimeString()}] ${r.agent}`)
          );
          printInfo(chalk.gray(`   Task: ${r.task}`));
          printInfo(
            chalk.gray(
              `   Decision: ${r.decision.substring(0, 80)}${r.decision.length > 80 ? '...' : ''}`
            )
          );
          printInfo('');
        });

        await persistence.close();
      } catch (error) {
        printError(chalk.red('Error:'), error.message);
      }
    });

  memory
    .command('query <searchQuery>')
    .description('Query decisions by keyword search')
    .option('-l, --limit <n>', 'Number of results', '10')
    .action(async (searchQuery, options) => {
      try {
        const projectRoot = getProjectRoot();
        const persistence = createSessionPersistence(projectRoot);
        await persistence.init();

        printInfo(chalk.cyan(`\n🔍 Querying: "${searchQuery}"\n`));

        const results = await persistence.searchDecisions(searchQuery, parseInt(options.limit));

        if (results.length === 0) {
          printWarning(chalk.yellow('No matching decisions found.'));
          printInfo(chalk.gray('Try different keywords or check if sessions exist.'));
          return;
        }

        printSuccess(chalk.green(`Found ${results.length} results:\n`));

        const table = new Table({
          head: ['Date', 'Agent', 'Task', 'Decision'],
          colWidths: [20, 15, 30, 35],
          style: { head: ['cyan'] },
        });

        results.forEach((r) => {
          table.push([
            new Date(r.created_at).toLocaleDateString(),
            chalk.white(r.agent),
            r.task.substring(0, 28),
            r.decision.substring(0, 32) + (r.decision.length > 32 ? '...' : ''),
          ]);
        });

        console.log(table.toString());

        await persistence.close();
      } catch (error) {
        printError(chalk.red('Error:'), error.message);
      }
    });

  memory
    .command('stats [sessionId]')
    .description('Show memory statistics')
    .action(async (sessionId) => {
      try {
        const projectRoot = getProjectRoot();
        const persistence = createSessionPersistence(projectRoot);
        await persistence.init();

        const stats = sessionId
          ? await persistence.getDecisionStats(sessionId)
          : await persistence.db.get(`
            SELECT 
              COUNT(*) as total_decisions, 
              COUNT(DISTINCT session_id) as total_sessions 
            FROM decisions
          `);

        printInfo(chalk.cyan.bold('\n📊 Memory Statistics:\n'));

        if (sessionId) {
          printInfo(`Session: ${chalk.white(sessionId)}`);
          printInfo(`Total decisions: ${chalk.white(stats.total_decisions)}`);
          printInfo(`Unique agents: ${chalk.white(stats.unique_agents)}`);
          if (stats.first_decision) {
            printInfo(
              `First decision: ${chalk.white(new Date(stats.first_decision).toLocaleString())}`
            );
            printInfo(
              `Last decision: ${chalk.white(new Date(stats.last_decision).toLocaleString())}`
            );
          }
        } else {
          printInfo(`Total decisions (all sessions): ${chalk.white(stats.total_decisions)}`);
          printInfo(`Total sessions: ${chalk.white(stats.total_sessions)}`);
        }

        printInfo('');
        await persistence.close();
      } catch (error) {
        printError(chalk.red('Error:'), error.message);
      }
    });
}
