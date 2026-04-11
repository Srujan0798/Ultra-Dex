import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(scriptDir, '..');
const repoRoot = path.resolve(packageRoot, '..', '..');
const stagingRoot = path.join(packageRoot, '.publish');

const copyTargets = [
  {
    from: path.join(packageRoot, 'bin'),
    to: path.join(stagingRoot, 'apps', 'cli', 'bin'),
  },
  {
    from: path.join(packageRoot, 'lib'),
    to: path.join(stagingRoot, 'apps', 'cli', 'lib'),
  },
  {
    from: path.join(packageRoot, 'assets'),
    to: path.join(stagingRoot, 'apps', 'cli', 'assets'),
  },
  {
    from: path.join(packageRoot, 'templates'),
    to: path.join(stagingRoot, 'apps', 'cli', 'templates'),
  },
  {
    from: path.join(repoRoot, 'src', 'core'),
    to: path.join(stagingRoot, 'src', 'core'),
  },
  {
    from: path.join(repoRoot, 'src', 'services'),
    to: path.join(stagingRoot, 'src', 'services'),
  },
  {
    from: path.join(repoRoot, 'src', 'utils'),
    to: path.join(stagingRoot, 'src', 'utils'),
  },
];

rmSync(stagingRoot, { recursive: true, force: true });

for (const { from, to } of copyTargets) {
  if (!existsSync(from)) {
    continue;
  }

  mkdirSync(path.dirname(to), { recursive: true });
  cpSync(from, to, {
    recursive: true,
    force: true,
  });
}

console.log(`Prepared publish tree in ${stagingRoot}`);
