import { glob } from 'glob';
import fs from 'fs/promises';

const DEFAULT_IGNORE = ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**', '**/.ultra-dex/**', '**/.ultra/**'];

export async function runArchitecturalGates(projectDir, config = {}) {
  const banned = config.banned_patterns || [];
  const required = config.required_patterns || [];

  const files = await glob('**/*.{js,ts,tsx,jsx}', { cwd: projectDir, ignore: DEFAULT_IGNORE, nodir: true });
  const bannedHits = [];
  const requiredHits = new Set();

  for (const file of files) {
    let content = '';
    try {
      content = await fs.readFile(`${projectDir}/${file}`, 'utf8');
    } catch {
      continue;
    }

    banned.forEach((pattern) => {
      if (content.includes(pattern)) {
        bannedHits.push({ file, pattern });
      }
    });

    required.forEach((pattern) => {
      if (content.includes(pattern)) {
        requiredHits.add(pattern);
      }
    });
  }

  const missingRequired = required.filter((pattern) => !requiredHits.has(pattern));

  return [
    {
      id: 'architecture-banned',
      value: bannedHits.length,
      details: { bannedHits }
    },
    {
      id: 'architecture-required',
      value: missingRequired.length,
      details: { missingRequired }
    }
  ];
}
