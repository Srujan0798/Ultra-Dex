// Copyright (c) 2026 Ultra-Dex

import { loadWhitelabelConfig } from './config.js';

export async function getThemeOverrides() {
  const config = await loadWhitelabelConfig();
  return {
    primary: config.colors?.primary || '#6366f1',
    secondary: config.colors?.secondary || '#111827',
  };
}

export default {
  getThemeOverrides,
};
