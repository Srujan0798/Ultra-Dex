import chalk from 'chalk';
import { getAvailableProviders, getDefaultProvider } from '../providers/index.js';
import { listSessions, saveSession } from './session.js';

export function createSlashCommands({ session, rl }) {
  const commands = {
    '/help': {
      description: 'Show available commands',
      handler: async () => {
        console.log(chalk.bold('\n📚 Available Commands:\n'));
        console.log(chalk.cyan('Slash Commands:'));
        Object.entries(commands).forEach(([cmd, { description }]) => {
          console.log(`  ${chalk.yellow(cmd)} - ${description}`);
        });
        console.log(chalk.cyan('\nRegular Input:'));
        console.log('  Type any question or task for AI assistance\n');
      },
    },
    '/clear': {
      description: 'Clear conversation history',
      handler: async () => {
        session.messages = [];
        console.log(chalk.green('✅ Conversation history cleared'));
      },
    },
    '/context': {
      description: 'Show current context usage',
      handler: async () => {
        const messageCount = session.messages.length;
        const contextSize = JSON.stringify(session).length;
        console.log(chalk.bold('\n📊 Context Usage:'));
        console.log(`  Messages: ${chalk.cyan(messageCount)}`);
        console.log(`  Size: ${chalk.cyan((contextSize / 1024).toFixed(2))} KB`);
        console.log(`  Session ID: ${chalk.gray(session.id)}\n`);
      },
    },
    '/model': {
      description: 'Show or set AI provider/model',
      handler: async (args) => {
        const available = getAvailableProviders().map((p) => p.id);

        if (args.length === 0) {
          const provider = session.config?.provider || getDefaultProvider() || 'openai';
          const model = session.config?.model || '(default)';
          console.log(chalk.bold('\n🤖 Model Configuration:'));
          console.log(`  Provider: ${chalk.cyan(provider)}`);
          console.log(`  Model: ${chalk.cyan(model)}\n`);
          console.log(chalk.gray(`Available providers: ${available.join(', ')}`));
          console.log(chalk.gray('Use: /model <provider> [model]')); 
          return;
        }

        const [provider, model] = args;
        if (!available.includes(provider)) {
          console.log(chalk.red(`❌ Unknown provider: ${provider}`));
          console.log(chalk.gray(`Available providers: ${available.join(', ')}`));
          return;
        }

        session.config = session.config || {};
        session.config.provider = provider;
        session.config.model = model || null;
        await saveSession(session);

        console.log(chalk.green(`✅ Provider set to ${provider}${model ? ` (${model})` : ''}`));
      },
    },
    '/sessions': {
      description: 'List all saved sessions',
      handler: async () => {
        const sessions = await listSessions();
        console.log(chalk.bold('\n💾 Saved Sessions:\n'));
        sessions.forEach((s, i) => {
          const date = new Date(s.createdAt).toLocaleDateString();
          const marker = s.id === session.id ? chalk.green(' (current)') : '';
          console.log(`  ${i + 1}. ${chalk.cyan(s.id)} - ${chalk.gray(date)}${marker}`);
        });
        console.log('');
      },
    },
    '/save': {
      description: 'Save current session manually',
      handler: async () => {
        await saveSession(session);
        console.log(chalk.green(`✅ Session saved: ${session.id}`));
      },
    },
    '/exit': {
      description: 'Exit REPL and save session',
      handler: async () => {
        await saveSession(session);
        console.log(chalk.green('\n👋 Goodbye! Session saved.\n'));
        rl.close();
        process.exit(0);
      },
    },
    '/quit': {
      description: 'Alias for /exit',
      handler: async (args) => {
        await commands['/exit'].handler(args);
      },
    },
  };

  return commands;
}

export async function executeSlashCommand(input, session, rl, commands) {
  const [cmd, ...args] = input.split(' ');
  const command = commands[cmd];

  if (!command) {
    console.log(chalk.red(`\n❌ Unknown command: ${cmd}`));
    console.log(chalk.dim('Type /help for available commands\n'));
    return false;
  }

  await command.handler(args, session, rl);
  return true;
}
