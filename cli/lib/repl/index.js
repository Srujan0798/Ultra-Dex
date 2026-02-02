import readline from 'readline';
import chalk from 'chalk';
import { program } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const SESSION_DIR = path.join(os.homedir(), '.ultra-dex', 'sessions');

// Session management
async function createSession() {
  const session = {
    id: `session-${Date.now()}`,
    createdAt: new Date().toISOString(),
    messages: [],
    context: {},
  };
  await saveSession(session);
  return session;
}

async function getSession(id) {
  if (id === 'latest') {
    const sessions = await listSessions();
    id = sessions[0]?.id;
  }
  const file = path.join(SESSION_DIR, `${id}.json`);
  try {
    const data = await fs.readFile(file, 'utf8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function saveSession(session) {
  await fs.mkdir(SESSION_DIR, { recursive: true });
  const file = path.join(SESSION_DIR, `${session.id}.json`);
  await fs.writeFile(file, JSON.stringify(session, null, 2));
}

async function listSessions() {
  try {
    await fs.mkdir(SESSION_DIR, { recursive: true });
    const files = await fs.readdir(SESSION_DIR);
    const sessions = await Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .map(async f => {
          const data = await fs.readFile(path.join(SESSION_DIR, f), 'utf8');
          return JSON.parse(data);
        })
    );
    return sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch {
    return [];
  }
}

// Slash commands
const slashCommands = {
  '/help': {
    description: 'Show available commands',
    handler: async (args, session, rl) => {
      console.log(chalk.bold('\n📚 Available Commands:\n'));
      console.log(chalk.cyan('Slash Commands:'));
      Object.entries(slashCommands).forEach(([cmd, { description }]) => {
        console.log(`  ${chalk.yellow(cmd)} - ${description}`);
      });
      console.log(chalk.cyan('\nRegular Input:'));
      console.log('  Type any question or task for AI assistance\n');
    },
  },
  '/clear': {
    description: 'Clear conversation history',
    handler: async (args, session, rl) => {
      session.messages = [];
      console.log(chalk.green('✅ Conversation history cleared'));
    },
  },
  '/context': {
    description: 'Show current context usage',
    handler: async (args, session, rl) => {
      const messageCount = session.messages.length;
      const contextSize = JSON.stringify(session).length;
      console.log(chalk.bold('\n📊 Context Usage:'));
      console.log(`  Messages: ${chalk.cyan(messageCount)}`);
      console.log(`  Size: ${chalk.cyan((contextSize / 1024).toFixed(2))} KB`);
      console.log(`  Session ID: ${chalk.gray(session.id)}\n`);
    },
  },
  '/sessions': {
    description: 'List all saved sessions',
    handler: async (args, session, rl) => {
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
    handler: async (args, session, rl) => {
      await saveSession(session);
      console.log(chalk.green(`✅ Session saved: ${session.id}`));
    },
  },
  '/exit': {
    description: 'Exit REPL and save session',
    handler: async (args, session, rl) => {
      await saveSession(session);
      console.log(chalk.green('\n👋 Goodbye! Session saved.\n'));
      rl.close();
      process.exit(0);
    },
  },
  '/quit': {
    description: 'Alias for /exit',
    handler: async (args, session, rl) => {
      await slashCommands['/exit'].handler(args, session, rl);
    },
  },
};

// Execute slash command
async function executeSlashCommand(input, session, rl) {
  const [cmd, ...args] = input.split(' ');
  const command = slashCommands[cmd];
  
  if (!command) {
    console.log(chalk.red(`\n❌ Unknown command: ${cmd}`));
    console.log(chalk.dim('Type /help for available commands\n'));
    return false;
  }
  
  await command.handler(args, session, rl);
  return true;
}

// Process regular AI input (placeholder for now)
async function processAIInput(input, session) {
  // For now, just echo back with context awareness
  console.log(chalk.dim('\n🤖 AI Response:'));
  console.log(chalk.cyan(`Received: "${input}"`));
  console.log(chalk.dim(`Session has ${session.messages.length} previous messages\n`));
  
  // Add to session history
  session.messages.push({ role: 'user', content: input });
  session.messages.push({ 
    role: 'assistant', 
    content: `Echo: ${input}` 
  });
}

// Main REPL function
export async function startREPL(options = {}) {
  // Load or create session
  let session;
  if (options.continue) {
    session = await getSession('latest');
    if (session) {
      console.log(chalk.green(`\n📂 Resumed session: ${session.id}`));
    }
  }
  
  if (!session) {
    session = await createSession();
    console.log(chalk.green(`\n✨ New session created: ${session.id}`));
  }

  // Create readline interface
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: chalk.cyan.bold('ultra-dex> '),
  });

  // Welcome message
  console.log(chalk.bold.hex('#7c3aed')('\n🚀 Ultra-Dex Interactive Mode\n'));
  console.log(chalk.dim('Type /help for commands, /exit to quit\n'));
  console.log(chalk.gray('Session ID:'), chalk.cyan(session.id), '\n');

  // Start prompt
  rl.prompt();

  // Handle input
  rl.on('line', async (input) => {
    const trimmed = input.trim();
    
    if (!trimmed) {
      rl.prompt();
      return;
    }

    try {
      if (trimmed.startsWith('/')) {
        // Execute slash command
        const shouldContinue = await executeSlashCommand(trimmed, session, rl);
        if (!shouldContinue && trimmed === '/exit') {
          return; // Exit handled in command
        }
      } else {
        // Process as AI input
        await processAIInput(trimmed, session);
      }
      
      // Auto-save after each interaction
      await saveSession(session);
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}\n`));
    }

    rl.prompt();
  });

  // Handle exit
  rl.on('close', async () => {
    await saveSession(session);
    console.log(chalk.green('\n👋 Session saved. Goodbye!\n'));
    process.exit(0);
  });

  // Handle Ctrl+C gracefully
  process.on('SIGINT', async () => {
    console.log(chalk.yellow('\n\n⚠️ Interrupted'));
    await saveSession(session);
    console.log(chalk.green('✅ Session saved'));
    process.exit(0);
  });
}

// Export for CLI integration
export { createSession, getSession, saveSession, listSessions };