import gradient from 'gradient-string';
import chalk from 'chalk';
import { theme } from '../theme.js';
export function createGradientBanner(text, gradientType = 'professional') {
  const gradients = {
    professional: gradient(['#8e2de2', '#4a00e0']),
    success: gradient(['#00b09b', '#96c93d']),
    warning: gradient(['#f59e0b', '#f97316']),
    error: gradient(['#ef4444', '#dc2626']),
    info: gradient(['#38bdf8', '#0ea5e9']),
  };
  const grad = gradients[gradientType] || gradients.professional;
  const lines = text.split('\n');
  return lines.map((line) => grad(line)).join('\n');
}
export function createStatusSpinner(type = 'thinking') {
  const spinners = {
    thinking: { icon: '🧠', text: 'Thinking...' },
    building: { icon: '🔨', text: 'Building...' },
    analyzing: { icon: '🔍', text: 'Analyzing...' },
    deploying: { icon: '🚀', text: 'Deploying...' },
    syncing: { icon: '🔄', text: 'Syncing...' },
  };
  const spinner = spinners[type] || spinners.thinking;
  return chalk.blue(spinner.icon) + ' ' + chalk.bold(spinner.text);
}
