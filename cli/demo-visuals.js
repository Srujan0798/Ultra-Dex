process.env.FORCE_COLOR = '3';
import { showBanner } from './lib/commands/banner.js';
import { showVersionCard } from './lib/utils/version-display.js';
import { createSpinner, success, info, warn, fail } from './lib/utils/spinners.js';
import { showHelp } from './lib/utils/help.js';
import { icons, statusLine, header } from './lib/utils/status.js';
import { createProgressBar } from './lib/utils/progress.js';
import chalk from 'chalk';

async function runDemo() {
  console.log('\n--- BANNER ---');
  showBanner();

  console.log('\n--- VERSION CARD ---');
  showVersionCard();

  console.log('\n--- HELP MENU ---');
  showHelp();

  console.log('\n--- STATUS INDICATORS ---');
  header('Project Status');
  statusLine(icons.success, 'Dependencies verified');
  statusLine(icons.info, 'Config loaded from .ultra-dex/config.json');
  statusLine(icons.warning, '3 agents require API keys');
  statusLine(icons.error, 'Build failed in 12 files');
  
  console.log('\n--- SPINNERS & PROGRESS ---');
  const spinner = createSpinner('Initializing swarm intelligence...');
  spinner.start();
  
  await new Promise(r => setTimeout(r, 1500));
  spinner.succeed(chalk.green('Swarm ready'));

  const progress = createProgressBar(100);
  console.log('Generating implementation plan:');
  for (let i = 0; i <= 100; i += 10) {
    progress.update(i, `Step ${i/10}/10`);
    await new Promise(r => setTimeout(r, 100));
  }
  
  console.log('\nDemo complete!\n');
}

runDemo().catch(console.error);
