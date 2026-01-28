// cli/lib/commands/diff.js
import chalk from 'chalk';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

export function diffCommand(options) {
  console.log(chalk.cyan.bold('\n📊 Ultra-Dex Diff - Plan vs Code\n'));

  const planPath = join(process.cwd(), 'IMPLEMENTATION-PLAN.md');
  if (!existsSync(planPath)) {
    console.log(chalk.red('No IMPLEMENTATION-PLAN.md found'));
    return;
  }

  const plan = readFileSync(planPath, 'utf-8');
  
  // Extract planned features
  const plannedFeatures = extractFeatures(plan);
  
  if (plannedFeatures.length === 0) {
    console.log(chalk.yellow('No features found in IMPLEMENTATION-PLAN.md (looking for ### headings)'));
    return;
  }

  // Check what exists in code
  const implemented = checkImplemented(plannedFeatures);
  
  console.log(chalk.white.bold('\nPlanned vs Implemented:\n'));
  
  implemented.forEach(({ feature, exists }) => {
    const icon = exists ? chalk.green('✅') : chalk.red('❌');
    console.log(`  ${icon} ${feature}`);
  });
  
  const score = implemented.filter(f => f.exists).length / implemented.length * 100;
  console.log(chalk.white.bold(`\nAlignment: ${score.toFixed(0)}%`));
}

function extractFeatures(plan) {
  const features = [];
  const lines = plan.split('\n');
  
  lines.forEach(line => {
    if (line.match(/^###?\s+/)) {
      features.push(line.replace(/^#+\s+/, '').trim());
    }
  });
  
  return features.slice(0, 20); // Limit for demo
}

function checkImplemented(features) {
  const srcExists = existsSync(join(process.cwd(), 'src'));
  const appExists = existsSync(join(process.cwd(), 'app'));
  const libExists = existsSync(join(process.cwd(), 'lib'));
  
  const searchDir = srcExists ? 'src' : appExists ? 'app' : libExists ? 'lib' : '.';

  return features.map(feature => {
    const keywords = feature.toLowerCase().split(' ').filter(k => k.length > 3);
    const exists = keywords.some(kw => 
      searchInCode(kw, searchDir)
    );
    return { feature, exists };
  });
}

function searchInCode(keyword, dir) {
  // Simple check - in real impl, use grep
  try {
    const files = readdirSync(join(process.cwd(), dir), { recursive: true });
    return files.some(f => f.toLowerCase().includes(keyword));
  } catch (e) {
    return false;
  }
}
