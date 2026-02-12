// Copyright (c) 2026 Ultra-Dex
// Neovim Plugin — JS bridge for plugin system registration

/**
 * Neovim Plugin for Ultra-Dex
 * Core implementation is in init.lua / lua/ (Lua).
 * This file provides the JS-side manifest for Ultra-Dex plugin registry.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const metadata = {
  name: 'neovim',
  displayName: 'Ultra-Dex for Neovim',
  type: 'ide-extension',
  runtime: 'lua',
  entryPoint: 'init.lua',
  capabilities: ['code-assist', 'diagnostics', 'telescope-integration'],
};

export function getCapabilityManifest() {
  try {
    const raw = fs.readFileSync(path.join(__dirname, 'capability_manifest.json'), 'utf8');
    return JSON.parse(raw);
  } catch {
    return metadata;
  }
}

export default { metadata, getCapabilityManifest };
