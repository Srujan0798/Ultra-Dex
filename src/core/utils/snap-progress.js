// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';

/**
 * Snap Progress Bar (Avengers Edition)
 * Infinity Stones: Power, Space, Reality, Soul, Time, Mind
 */
const STONES = [
  { name: 'Power', color: '#9d4edd', symbol: '🟣' },
  { name: 'Space', color: '#4895ef', symbol: '🔵' },
  { name: 'Reality', color: '#f72585', symbol: '🔴' },
  { name: 'Soul', color: '#ff9e00', symbol: '🟠' },
  { name: 'Time', color: '#4cc9f0', symbol: '🟢' },
  { name: 'Mind', color: '#fee440', symbol: '🟡' },
];

export function renderSnapProgress(step, total = 6) {
  const stonesCollected = Math.min(step, STONES.length);
  const line = STONES.map((s, i) => {
    if (i < stonesCollected) return chalk.hex(s.color)(s.symbol);
    return chalk.gray('⚪');
  }).join(' ');

  const percentage = Math.round((step / total) * 100);
  let status = `[${line}] ${percentage}%`;

  if (step >= total) {
    status += chalk.bold.cyan('\n"Perfectly balanced, as all code should be." 🫰');
  }

  return status;
}

// Backward-compatible export used by older command modules.
export const snapProgress = renderSnapProgress;
