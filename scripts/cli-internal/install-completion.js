import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLI_ROOT = path.resolve(__dirname, '..');
const COMPLETIONS_DIR = path.join(CLI_ROOT, 'completions');

const TARGETS = {
  zsh: {
    source: '_ultra-dex',
    targetDir: path.join(os.homedir(), '.zsh', 'completions'),
    post: 'Add to ~/.zshrc: fpath+=~/.zsh/completions && compinit',
  },
  fish: {
    source: 'ultra-dex.fish',
    targetDir: path.join(os.homedir(), '.config', 'fish', 'completions'),
    post: 'Restart your shell or run: source ~/.config/fish/config.fish',
  },
  bash: {
    source: 'ultra-dex.bash',
    targetDir: path.join(os.homedir(), '.bash_completion.d'),
    post: 'Add to ~/.bashrc: source ~/.bash_completion.d/ultra-dex',
  },
};

export async function installCompletion({ shell = 'zsh' } = {}) {
  const target = TARGETS[shell];
  if (!target) {
    throw new Error(`Unsupported shell: ${shell}`);
  }

  const sourcePath = path.join(COMPLETIONS_DIR, target.source);
  const targetPath = path.join(target.targetDir, target.source);

  await fs.mkdir(target.targetDir, { recursive: true });
  await fs.copyFile(sourcePath, targetPath);

  return {
    shell,
    sourcePath,
    targetPath,
    post: target.post,
  };
}

export async function installAllCompletions() {
  const shells = Object.keys(TARGETS);
  const results = [];
  for (const shell of shells) {
    results.push(await installCompletion({ shell }));
  }
  return results;
}

export default {
  installCompletion,
  installAllCompletions,
};
