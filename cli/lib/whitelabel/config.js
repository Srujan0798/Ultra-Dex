// Copyright (c) 2026 Ultra-Dex

import fs from 'fs/promises';
import path from 'path';

const DEFAULT_CONFIG = {
  name: 'Ultra-Dex',
  command: 'ultra-dex',
  logo: './assets/logo.png',
  colors: {
    primary: '#6366f1',
    secondary: '#111827',
  },
  footer: 'Powered by Ultra-Dex',
};

export async function loadWhitelabelConfig(configPath = 'whitelabel.json') {
  try {
    const content = await fs.readFile(path.resolve(configPath), 'utf8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(content) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export async function saveWhitelabelConfig(config, configPath = 'whitelabel.json') {
  const payload = { ...DEFAULT_CONFIG, ...config };
  await fs.writeFile(path.resolve(configPath), JSON.stringify(payload, null, 2));
  return payload;
}

export default {
  loadWhitelabelConfig,
  saveWhitelabelConfig,
};
