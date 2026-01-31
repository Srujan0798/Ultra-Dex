/**
 * ultra-dex memory command
 * Manage persistent memory for AI agents
 */

import chalk from 'chalk';
import Table from 'cli-table3';
import { ultraMemory } from '../mcp/memory.js';
import { createSessionPersistence } from '../utils/sessionPersistence.js';
import { getProjectRoot } from '../utils/config.js';

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

      console.log(chalk.cyan.bold('\n🧠 Ultra-Dex Persistent Memory\n'));
      
      if (items.length === 0) {
        console.log(chalk.gray('  Memory is empty.'));
        return;
      }

      items.forEach((item, i) => {
        console.log(chalk.white(`${i + 1}. [${new Date(item.timestamp).toLocaleDateString()}] (${item.source})`));
        console.log(chalk.gray(`   ${item.text}`));
        if (item.tags && item.tags.length > 0) {
          console.log(chalk.blue(`   Tags: ${item.tags.join(', ')}`));
        }
        console.log();
      });
    });

  memory
    .command('add <text>')
    .description('Add a fact to memory')
    .option('-t, --tags <tags>', 'Comma-separated tags')
    .action(async (text, options) => {
      const tags = options.tags ? options.tags.split(',').map(t => t.trim()) : [];
      await ultraMemory.remember(text, tags, 'manual');
      console.log(chalk.green('✅ Fact remembered.'));
    });

  memory
    .command('search <query>')
    .description('Search memory')
    .action(async (query) => {
      const results = await ultraMemory.search(query);
      console.log(chalk.cyan.bold(`\n🔍 Search Results for "${query}":\n`));
      
      if (results.length === 0) {
        console.log(chalk.gray('  No matches found.'));
        return;
      }

      results.forEach((item, i) => {
        console.log(chalk.white(`${i + 1}. [${new Date(item.timestamp).toLocaleDateString()}]`));
        console.log(chalk.gray(`   ${item.text}`));
        console.log();
      });
    });

  memory
    .command('clear')
    .description('Clear all memory')
    .option('--before <date>', 'Clear before date (ISO)')
    .action(async (options) => {
      await ultraMemory.clear(options.before);
      console.log(chalk.green('✅ Memory cleared.'));
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
          console.log(chalk.yellow('\n📁 No sessions found.\n'));
          console.log(chalk.gray('Start a swarm to create a session.'));
          return;
        }
        
        console.log(chalk.cyan.bold('\n📁 Persistent Sessions:\n'));
        
        for (const session of sessions) {
          const stats = await persistence.getDecisionStats(session.id);
          
          console.log(chalk.white(`${session.name}`));
          console.log(chalk.gray(`   ID: ${session.id}`));
          console.log(chalk.gray(`   Created: ${new Date(session.created_at).toLocaleString()}`));
          console.log(chalk.gray(`   Decisions: ${stats.total_decisions} by ${stats.unique_agents} agents`));
          console.log();
        }
        
        await persistence.close();
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
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
          console.log(chalk.yellow('No session ID provided.'));
          console.log(chalk.gray('Use `memory sessions` to list available sessions.'));
          return;
        }
        
        console.log(chalk.cyan(`\n📋 Decisions for session ${sessionId}\n`));
        
        const results = await persistence.getRecentDecisions(sessionId, parseInt(options.limit));
        
        if (results.length === 0) {
          console.log(chalk.yellow('No decisions found for this session.'));
          return;
        }
        
        results.forEach((r, i) => {
          console.log(chalk.white(`${i + 1}. [${new Date(r.created_at).toLocaleTimeString()}] ${r.agent}`));
          console.log(chalk.gray(`   Task: ${r.task}`));
          console.log(chalk.gray(`   Decision: ${r.decision.substring(0, 80)}${r.decision.length > 80 ? '...' : ''}`));
          console.log();
        });
        
        await persistence.close();
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
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
        
        console.log(chalk.cyan(`\n🔍 Querying: "${searchQuery}"\n`));
        
        const results = await persistence.searchDecisions(searchQuery, parseInt(options.limit));
        
        if (results.length === 0) {
          console.log(chalk.yellow('No matching decisions found.'));
          console.log(chalk.gray('Try different keywords or check if sessions exist.'));
          return;
        }
        
        console.log(chalk.green(`Found ${results.length} results:\n`));
        
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
        console.error(chalk.red('Error:'), error.message);
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
        
        console.log(chalk.cyan.bold('\n📊 Memory Statistics:\n'));
        
        if (sessionId) {
          console.log(`Session: ${chalk.white(sessionId)}`);
          console.log(`Total decisions: ${chalk.white(stats.total_decisions)}`);
          console.log(`Unique agents: ${chalk.white(stats.unique_agents)}`);
          if (stats.first_decision) {
            console.log(`First decision: ${chalk.white(new Date(stats.first_decision).toLocaleString())}`);
            console.log(`Last decision: ${chalk.white(new Date(stats.last_decision).toLocaleString())}`);
          }
        } else {
          console.log(`Total decisions (all sessions): ${chalk.white(stats.total_decisions)}`);
          console.log(`Total sessions: ${chalk.white(stats.total_sessions)}`);
        }
        
        console.log();
        await persistence.close();
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
}
