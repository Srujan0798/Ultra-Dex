import chalk from 'chalk';
const STONES = [
  { name: 'Power', color: '#9d4edd', symbol: '\u{1F7E3}' },
  { name: 'Space', color: '#4895ef', symbol: '\u{1F535}' },
  { name: 'Reality', color: '#f72585', symbol: '\u{1F534}' },
  { name: 'Soul', color: '#ff9e00', symbol: '\u{1F7E0}' },
  { name: 'Time', color: '#4cc9f0', symbol: '\u{1F7E2}' },
  { name: 'Mind', color: '#fee440', symbol: '\u{1F7E1}' },
] as const;
function renderSnapProgress(step: number, total: number = 6): string {
  const stonesCollected = Math.min(step, STONES.length);
  const line = STONES.map((s, i) => {
    if (i < stonesCollected) return chalk.hex(s.color)(s.symbol);
    return chalk.gray('\u26AA');
  }).join(' ');
  const percentage = Math.round((step / total) * 100);
  let status = `[${line}] ${percentage}%`;
  if (step >= total) {
    status += chalk.bold.cyan('\n"Perfectly balanced, as all code should be." \u{1FAF0}');
  }
  return status;
}
const snapProgress = renderSnapProgress;
export { renderSnapProgress, snapProgress };
