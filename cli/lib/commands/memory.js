/**
 * ultra-dex memory command
 * Manage persistent memory for AI agents
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import { ultraMemory } from '../mcp/memory.js';
import { createSessionPersistence } from '../utils/sessionPersistence.js';
import { getProjectRoot } from '../utils/config.js';
import { printError, printInfo, printSuccess, printWarning } from '../utils/output.js';

export function registerMemoryCommand(program) {
  const memory = program
    .command('memory')
    .description('Manage persistent agent memory');

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
        printInfo(chalk.white(`${i + 1}. [${new Date(item.timestamp).toLocaleDateString()}] (${item.source})`));
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
    .action(async (text, options) => {
      if (!text || text.trim().length === 0) {
          printError(chalk.red('Text content is required.'));
          return;
      }
      const tags = options.tags ? options.tags.split(',').map(t => t.trim()) : [];
      await ultraMemory.remember(text, tags, 'manual');
      printSuccess(chalk.green('✅ Fact remembered.'));
    });

  memory
    .command('search <query>')
    .description('Search memory')
    .action(async (query) => {
      if (!query || query.trim().length === 0) {
          printError(chalk.red('Search query is required.'));
          return;
      }
      const results = await ultraMemory.search(query);
      printInfo(chalk.cyan.bold(`\n🔍 Search Results for "${query}":\n`));
      
      if (results.length === 0) {
        printInfo(chalk.gray('  No matches found.'));
        return;
      }

      results.forEach((item, i) => {
        printInfo(chalk.white(`${i + 1}. [${new Date(item.timestamp).toLocaleDateString()}]`));
        printInfo(chalk.gray(`   ${item.text}`));
        printInfo('');
      });
    });

  memory
    .command('clear')
    .description('Clear all memory')
    .option('--before <date>', 'Clear before date (ISO)')
    .action(async (options) => {
      if (options.before) {
          const date = new Date(options.before);
          if (isNaN(date.getTime())) {
              printError(chalk.red('Invalid date format. Use ISO format (e.g. 2023-01-01).'));
              return;
          }
      }
      await ultraMemory.clear(options.before);
      printSuccess(chalk.green('✅ Memory cleared.'));
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
          printInfo(chalk.gray(`   Decisions: ${stats.total_decisions} by ${stats.unique_agents} agents`));
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
          printInfo(chalk.white(`${i + 1}. [${new Date(r.created_at).toLocaleTimeString()}] ${r.agent}`));
          printInfo(chalk.gray(`   Task: ${r.task}`));
          printInfo(chalk.gray(`   Decision: ${r.decision.substring(0, 80)}${r.decision.length > 80 ? '...' : ''}`));
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
          style: { head: ['cyan'] }
        });
        
        results.forEach(r => {
          table.push([
            new Date(r.created_at).toLocaleDateString(),
            chalk.white(r.agent),
            r.task.substring(0, 28),
            r.decision.substring(0, 32) + (r.decision.length > 32 ? '...' : '')
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
            printInfo(`First decision: ${chalk.white(new Date(stats.first_decision).toLocaleString())}`);
            printInfo(`Last decision: ${chalk.white(new Date(stats.last_decision).toLocaleString())}`);
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