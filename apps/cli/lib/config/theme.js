// Copyright (c) 2026 Ultra-Dex

import chalk from 'chalk';
import { doomsdayTheme } from '../themes/doomsday.js';

export const themes = {
  default: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#d946ef',
    success: '#22c55e',
    warning: '#eab308',
    error: '#ef4444',
    dim: '#6b7280',
  },
  ocean: {
    primary: '#0ea5e9',
    secondary: '#06b6d4',
    accent: '#14b8a6',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#f43f5e',
    dim: '#64748b',
  },
  forest: {
    primary: '#22c55e',
    secondary: '#10b981',
    accent: '#14b8a6',
    success: '#22c55e',
    warning: '#eab308',
    error: '#ef4444',
    dim: '#6b7280',
  },
  cyberpunk: {
    primary: '#00f5ff',
    secondary: '#ff2e63',
    accent: '#08f7fe',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    dim: '#475569',
  },
  doomsday: {
    primary: doomsdayTheme.primary,
    secondary: doomsdayTheme.secondary,
    accent: doomsdayTheme.accent,
    success: '#f59e0b',
    warning: '#f97316',
    error: '#dc2626',
    dim: '#4b5563',
  },
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

/**
 * Handle errors in theme module
 * @param {Error} error - The error to handle
 * @param {string} [context='theme'] - Error context
 */
function handleModuleError(error, context = 'theme') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
