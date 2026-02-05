import chalk from 'chalk';

const STONES = [
  { name: 'Power', color: '#a855f7' },
  { name: 'Space', color: '#3b82f6' },
  { name: 'Reality', color: '#ef4444' },
  { name: 'Soul', color: '#f59e0b' },
  { name: 'Time', color: '#22c55e' },
  { name: 'Mind', color: '#eab308' }
];

export function renderSnapProgress(completed = 0) {
  const total = STONES.length;
  const stones = STONES.map((stone, index) => {
    const filled = index < completed;
    return filled
      ? chalk.hex(stone.color)('◆')
      : chalk.gray('◇');
  }).join(' ');

  const message = completed >= total
    ? chalk.green('Perfectly balanced, as all code should be.')
    : chalk.gray(`Stones awakened: ${completed}/${total}`);

  return `${stones}\n${message}`;
}

export default {
  renderSnapProgress
};
