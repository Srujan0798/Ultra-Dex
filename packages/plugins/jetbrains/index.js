// Copyright (c) 2026 Ultra-Dex
// JetBrains Plugin — JS bridge for plugin system registration

/**
 * JetBrains IDE Plugin (IntelliJ IDEA, WebStorm, etc.)
 * Core implementation is in build.gradle.kts / src/ (Kotlin).
 * This file provides the JS-side manifest for Ultra-Dex plugin registry.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const metadata = {
  name: 'jetbrains',
  displayName: 'Ultra-Dex for JetBrains',
  type: 'ide-extension',
  runtime: 'kotlin',
  entryPoint: 'build.gradle.kts',
  capabilities: ['code-assist', 'diagnostics', 'agent-panel'],
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
