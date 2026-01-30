import chalk from 'chalk';
// import ora from 'ora';

export function showProgress(tasks) {
  // eslint-disable-next-line no-unused-vars
  const _total = tasks.length;
  console.log('');
  console.log(chalk.hex('#8b5cf6').bold('  ⚡ EXECUTING TASKS...'));
  console.log('');
  
  tasks.forEach((task) => {
    // Simple vertical list for now
    console.log(`  ${chalk.hex('#d946ef')('►')} ${task}`);
  });
  console.log('');
}

export function progressBar(current, total, width = 40) {
  const percentage = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * width);
  const empty = width - filled;

  const bar = chalk.hex('#6366f1')('█'.repeat(filled)) + chalk.dim('░'.repeat(empty));
  return `${bar} ${chalk.hex('#d946ef')(percentage + '%')}`;
}
