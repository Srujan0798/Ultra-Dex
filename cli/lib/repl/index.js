import readline from 'readline';
import chalk from 'chalk';
import { getDefaultProvider } from '../providers/index.js';
import { createSession, getSession, saveSession } from './session.js';
import { createSlashCommands, executeSlashCommand } from './commands.js';

function buildPrompt(session, input) {
  const history = session.messages.slice(-6).map((msg) => `${msg.role}: ${msg.content}`).join('\n');
  return `${history}\nuser: ${input}\nassistant:`;
}

// Process regular AI input (placeholder for now; streaming wired in prompt 12)
async function processAIInput(input, session) {
  console.log(chalk.dim('\n🤖 AI Response:'));
  console.log(chalk.cyan(`Received: "${input}"`));
  console.log(chalk.dim(`Session has ${session.messages.length} previous messages\n`));

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
    session = await createSession({
      provider: getDefaultProvider() || 'openai',
      model: null
    });
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

  const slashCommands = createSlashCommands({ session, rl });

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
        const shouldContinue = await executeSlashCommand(trimmed, session, rl, slashCommands);
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
export { createSession, getSession, saveSession };
