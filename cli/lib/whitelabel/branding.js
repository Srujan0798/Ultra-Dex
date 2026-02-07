// Copyright (c) 2026 Ultra-Dex

import { loadWhitelabelConfig } from './config.js';

export async function getBranding() {
  const config = await loadWhitelabelConfig();
  return {
    name: config.name,
    command: config.command,
    logo: config.logo,
    footer: config.footer,
  };
}

export default {
  getBranding,
};
