import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

const DANGEROUS_PATTERNS = [
  /child_process\./g,
  /exec\(/g,
  /spawn\(/g,
  /rm\s+-rf/g,
  /process\.env/g,
  /fs\.writeFile\(/g,
  /net\.connect\(/g
];

export async function scanPlugin(pluginPath) {
  const files = await glob('**/*.{js,ts,mjs,cjs}', {
    cwd: pluginPath,
    nodir: true,
    ignore: ['**/node_modules/**']
  });

  const findings = [];
  for (const file of files) {
    const fullPath = path.join(pluginPath, file);
    const content = await fs.readFile(fullPath, 'utf8');
    for (const pattern of DANGEROUS_PATTERNS) {
      if (pattern.test(content)) {
        findings.push({ file, pattern: pattern.toString() });
      }
    }
  }
  return findings;
}
