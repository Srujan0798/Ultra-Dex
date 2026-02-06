/**
 * ultra-dex install-completion command
 * Shell Tab Autocomplete
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import inquirer from 'inquirer';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import { validateSafePath } from '../utils/validation.js';

// Shell detection and configuration
const SUPPORTED_SHELLS = {
  bash: {
    name: 'Bash',
    configFiles: ['.bashrc', '.bash_profile'],
    installInstruction: 'Add to ~/.bashrc or ~/.bash_profile',
  },
  zsh: {
    name: 'Zsh',
    configFiles: ['.zshrc'],
    installInstruction: 'Add to ~/.zshrc',
  },
  fish: {
    name: 'Fish',
    configFiles: ['.config/fish/config.fish'],
    installInstruction: 'Add to ~/.config/fish/config.fish',
  },
};

// Completion script templates for different shells
const COMPLETION_SCRIPTS = {
  bash: `# Ultra-Dex Bash Completion
_ultra_dex_completion() {
    local cur prev opts
    COMPREPLY=()
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"
    opts="$(ultra-dex --completion-bash \${COMP_WORDS[@]:1:COMP_CWORD-1})"

    if [[ \${cur} == -* ]] ; then
        COMPREPLY=( \$(compgen -W "\${opts}" -- \${cur}) )
        return 0
    else
        COMPREPLY=( \$(compgen -W "\${opts}" -- \${cur}) )
        return 0
    fi
}
complete -F _ultra_dex_completion ultra-dex
`,
  zsh: `# Ultra-Dex Zsh Completion
#compdef ultra-dex

_ultra_dex_completion() {
  local -a opts
  local cur
  cur=\${words[CURRENT]}
  opts=($(ultra-dex --completion-zsh \${words[2,CURRENT-1]}))

  if [[ \${cur} == -* ]]; then
    _describe 'options' opts
  else
    _describe 'arguments' opts
  fi
}

_ultra_dex_completion
`,
  fish: `# Ultra-Dex Fish Completion
# ultra-dex.fish
complete -c ultra-dex -a '(__ultra_dex_complete)'

function __ultra_dex_complete
    ultra-dex --completion-fish \$argv
end
`,
};

export async function installCompletion(options = {}) {
  printInfo(chalk.cyan('\n🔧 Installing Ultra-Dex Shell Completion\n'));

  // Detect the user's shell
  const detectedShell = await detectShell();
  printInfo(chalk.gray(`Detected shell: ${detectedShell}`));

  if (!SUPPORTED_SHELLS[detectedShell]) {
    printError(
      chalk.red(
        `Unsupported shell: ${detectedShell}. Supported shells: ${Object.keys(SUPPORTED_SHELLS).join(', ')}`
      )
    );

    const { selectedShell } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedShell',
        message: 'Select your shell:',
        choices: Object.keys(SUPPORTED_SHELLS).map((shell) => ({
          name: SUPPORTED_SHELLS[shell].name,
          value: shell,
        })),
      },
    ]);

    await installCompletionForShell(selectedShell);
  } else {
    await installCompletionForShell(detectedShell);
  }
}

/**
 * Detect the user's shell
 */
async function detectShell() {
  // Try to detect shell from environment
  const shellEnv = process.env.SHELL;

  if (shellEnv) {
    if (shellEnv.includes('zsh')) return 'zsh';
    if (shellEnv.includes('bash')) return 'bash';
    if (shellEnv.includes('fish')) return 'fish';
  }

  // Fallback to checking common shell config files
  const homeDir = os.homedir();

  // Check for zsh first (as it's popular)
  try {
    await fs.access(path.join(homeDir, '.zshrc'));
    return 'zsh';
  } catch (error) {
    // Not zsh, continue checking
  }

  // Check for bash
  try {
    await fs.access(path.join(homeDir, '.bashrc'));
    return 'bash';
  } catch (error) {
    // Not bash, continue checking
  }

  // Check for fish
  try {
    await fs.access(path.join(homeDir, '.config', 'fish', 'config.fish'));
    return 'fish';
  } catch (error) {
    // Not fish, default to bash
  }

  // Default to bash
  return 'bash';
}

/**
 * Install completion for a specific shell
 */
async function installCompletionForShell(shell) {
  const shellInfo = SUPPORTED_SHELLS[shell];
  if (!shellInfo) {
    throw new Error(`Unsupported shell: ${shell}`);
  }

  printInfo(chalk.gray(`Installing completion for ${shellInfo.name}...`));

  // Get the completion script
  const script = COMPLETION_SCRIPTS[shell];
  if (!script) {
    throw new Error(`No completion script available for shell: ${shell}`);
  }

  // Find the appropriate config file
  const homeDir = os.homedir();
  let configFile = null;

  for (const configFileName of shellInfo.configFiles) {
    const fullPath = path.join(homeDir, configFileName);
    try {
      await fs.access(fullPath);
      configFile = fullPath;
      break;
    } catch (error) {
      // File doesn't exist, continue to next
    }
  }

  // If no existing config file found, create one
  if (!configFile) {
    configFile = path.join(homeDir, shellInfo.configFiles[0]);
    printInfo(chalk.gray(`Creating new config file: ${configFile}`));

    // Create parent directories if they don't exist
    const parentDir = path.dirname(configFile);
    await fs.mkdir(parentDir, { recursive: true });

    // Create the file with basic content
    await fs.writeFile(configFile, `# ${shellInfo.name} configuration file\n`);
  }

  // Read the existing config file
  const configContent = await fs.readFile(configFile, 'utf8');

  // Check if completion is already installed
  if (
    configContent.includes('# Ultra-Dex Bash Completion') ||
    configContent.includes('# Ultra-Dex Zsh Completion') ||
    configContent.includes('# Ultra-Dex Fish Completion')
  ) {
    printWarning(chalk.yellow('Ultra-Dex completion is already installed in this file.'));

    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'Overwrite existing completion?',
        default: false,
      },
    ]);

    if (!overwrite) {
      printInfo(chalk.gray('Installation cancelled.'));
      return;
    }

    // Remove existing completion
    const lines = configContent.split('\n');
    const newLines = [];
    let skip = false;

    for (const line of lines) {
      if (line.includes('# Ultra-Dex') && line.includes('Completion')) {
        skip = true;
      }

      if (skip && (line.trim() === '' || !line.includes('# Ultra-Dex'))) {
        skip = false;
      }

      if (!skip) {
        newLines.push(line);
      }
    }

    const updatedConfig = newLines.join('\n');
    await fs.writeFile(configFile, updatedConfig);
    printInfo(chalk.gray('Removed old completion configuration.'));
  }

  // Append the completion script to the config file
  const updatedConfig = configContent + '\n\n' + script;
  await fs.writeFile(configFile, updatedConfig);

  printSuccess(chalk.green(`✅ Ultra-Dex completion installed for ${shellInfo.name}`));
  printInfo(chalk.gray(`Configuration added to: ${configFile}`));

  // Provide instructions for activation
  printInfo(chalk.cyan('\nTo activate the completion, run one of the following:'));

  switch (shell) {
    case 'bash':
      printInfo(chalk.gray('  source ~/.bashrc'));
      printInfo(chalk.gray('  # OR restart your terminal'));
      break;
    case 'zsh':
      printInfo(chalk.gray('  source ~/.zshrc'));
      printInfo(chalk.gray('  # OR run: exec zsh'));
      break;
    case 'fish':
      printInfo(chalk.gray('  source ~/.config/fish/config.fish'));
      printInfo(chalk.gray('  # OR restart your terminal'));
      break;
  }

  printInfo(chalk.gray('\nThe completion will now work for: ultra-dex [TAB]'));
}

export function registerInstallCompletionCommand(program) {
  program
    .command('install-completion')
    .alias('completion-install')
    .description('Install shell tab autocomplete for ultra-dex commands')
    .option('-s, --shell <shell>', 'Specify shell (bash, zsh, fish)')
    .option('-f, --force', 'Force installation without confirmation')
    .action(async (options) => {
      try {
        if (options.shell) {
          if (!SUPPORTED_SHELLS[options.shell]) {
            printError(
              chalk.red(
                `Unsupported shell: ${options.shell}. Supported: ${Object.keys(SUPPORTED_SHELLS).join(', ')}`
              )
            );
            return;
          }
          await installCompletionForShell(options.shell);
        } else {
          await installCompletion(options);
        }
      } catch (error) {
        printError(chalk.red(`Completion installation failed: ${error.message}`));
        process.exit(1);
      }
    });
}

// Additional function to generate completions for the CLI itself
export function generateCompletionSuggestions(words) {
  // This would be called by the completion script to provide suggestions
  // For now, return a basic set of commands
  const commands = [
    'init',
    'generate',
    'build',
    'review',
    'run',
    'agents',
    'dashboard',
    'sync',
    'verify',
    'check',
    'doctor',
    'deploy',
    'rollback',
    'jira',
    'trello',
    'api',
    'commit',
    'help',
    'version',
    'config',
    'state',
    'plan',
    'workspace',
    'auth',
    'setup',
    'forge',
    'examples',
  ];

  // If the last word is a command, return its options
  const lastWord = words[words.length - 1];
  if (commands.includes(lastWord)) {
    // Return options for the specific command
    return getCommandOptions(lastWord);
  }

  // Otherwise, return possible commands that start with the last word
  return commands.filter((cmd) => cmd.startsWith(lastWord || ''));
}

function getCommandOptions(command) {
  // Return options for a specific command
  const optionsMap = {
    init: ['--template', '--dir', '--force', '--help'],
    generate: ['--provider', '--model', '--output', '--stream', '--help'],
    build: ['--target', '--env', '--watch', '--help'],
    deploy: ['--env', '--force', '--dry-run', '--help'],
    rollback: ['--deploy', '--force', '--help'],
    jira: ['start', '--help'],
    trello: ['status', 'move', '--help'],
    api: ['list', 'test', 'status', '--help'],
    commit: ['--all', '--patch', '--interactive', '--message', '--help'],
  };

  return optionsMap[command] || [];
}

export default {
  installCompletion,
  installCompletionForShell,
  detectShell,
  generateCompletionSuggestions,
  registerInstallCompletionCommand,
};
