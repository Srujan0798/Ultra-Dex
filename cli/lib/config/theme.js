import chalk from 'chalk';

export const themes = {
  default: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#d946ef',
    success: '#22c55e',
    warning: '#eab308',
    error: '#ef4444',
    dim: '#6b7280'
  },
  ocean: {
    primary: '#0ea5e9',
    secondary: '#06b6d4',
    accent: '#14b8a6',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#f43f5e',
    dim: '#64748b'
  },
  forest: {
    primary: '#22c55e',
    secondary: '#10b981',
    accent: '#14b8a6',
    success: '#22c55e',
    warning: '#eab308',
    error: '#ef4444',
    dim: '#6b7280'
  }
};

let currentTheme = themes.default;

export function getTheme() {
  return currentTheme;
}

export function setTheme(name) {
  if (themes[name]) {
    currentTheme = themes[name];
  }
}

export function styled(type, text) {
  return chalk.hex(currentTheme[type])(text);
}