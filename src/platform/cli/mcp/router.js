// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Router module
 * @module mcp/router
 */

import fs from 'fs/promises';
import path from 'path';
import inquirer from 'inquirer';
import { printInfo, printWarning, printError } from '../utils/output.js';

const DEFAULT_POLICY = {
  requireApprovalFor: new Set(['high', 'critical']),
};

function parseWindow(windowValue) {
  if (!windowValue) return 60_000;
  const raw = String(windowValue).trim();
  const match = raw.match(/^(\d+)\s*(ms|s|m|h|d)$/i);
  if (!match) return 60_000;
  const amount = Number.parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const multipliers = {
    ms: 1,
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };
  return amount * (multipliers[unit] || 60_000);
}

class CapabilitiesRouter {
  constructor(options = {}) {
    this.pluginDirs = options.pluginDirs || [
      path.join(process.cwd(), '.ultra-dex', 'plugins'),
      path.join(process.cwd(), 'plugins'),
    ];
    this.policy = { ...DEFAULT_POLICY, ...(options.policy || {}) };
    this.toolCapabilities = new Map();
    this.rateLimitState = new Map();
    this.loaded = false;
  }

  async loadManifests() {
    this.toolCapabilities.clear();
    for (const baseDir of this.pluginDirs) {
      try {
        const entries = await fs.readdir(baseDir, { withFileTypes: true });
        for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          const manifestPath = path.join(baseDir, entry.name, 'capability_manifest.json');
          try {
            const raw = await fs.readFile(manifestPath, 'utf8');
            const manifest = JSON.parse(raw);
            if (!manifest?.tools || !Array.isArray(manifest.tools)) continue;
            manifest.tools.forEach((tool) => {
              if (!tool?.name) return;
              this.toolCapabilities.set(tool.name, {
                ...tool,
                plugin: manifest.name || entry.name,
                version: manifest.version || '0.0.0',
              });
            });
          } catch {
            // Ignore missing manifests
          }
        }
      } catch {
        // Ignore missing plugin directories
      }
    }
    this.loaded = true;
  }

  async ensureLoaded() {
    if (!this.loaded) {
      await this.loadManifests();
    }
  }

  getCapability(toolName) {
    return this.toolCapabilities.get(toolName) || null;
  }

  registerToolCapability(toolName, capability) {
    if (!toolName || !capability) return;
    this.toolCapabilities.set(toolName, { ...capability });
  }

  async enforceRateLimit(toolName, rateLimit) {
    if (!rateLimit?.max) return;
    const windowMs = parseWindow(rateLimit.window || '1m');
    const now = Date.now();
    const key = `${toolName}:${windowMs}:${rateLimit.max}`;
    const history = this.rateLimitState.get(key) || [];
    const fresh = history.filter((ts) => now - ts < windowMs);
    if (fresh.length >= rateLimit.max) {
      throw new Error(`Rate limit exceeded for ${toolName} (${rateLimit.max}/${rateLimit.window})`);
    }
    fresh.push(now);
    this.rateLimitState.set(key, fresh);
  }

  async requestApproval(toolName, capability) {
    if (!process.stdout.isTTY) {
      throw new Error(`Approval required for ${toolName} but no TTY is available.`);
    }

    printWarning(`⚠️  Tool requires approval: ${toolName}`);
    printInfo(`Plugin: ${capability.plugin || 'unknown'} · Risk: ${capability.riskScore || 'n/a'}`);
    if (capability.sideEffects?.length) {
      printInfo(`Side effects: ${capability.sideEffects.join(', ')}`);
    }

    const { allow } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'allow',
        message: `Allow ${toolName}?`,
        default: false,
      },
    ]);

    if (!allow) {
      throw new Error(`User denied permission for ${toolName}`);
    }
  }

  async enforceCapability(toolName) {
    await this.ensureLoaded();
    const capability = this.getCapability(toolName);
    if (!capability) return;

    if (capability.rateLimit) {
      await this.enforceRateLimit(toolName, capability.rateLimit);
    }

    const risk = String(capability.riskScore || '').toLowerCase();
    if (capability.requiresApproval || this.policy.requireApprovalFor.has(risk)) {
      await this.requestApproval(toolName, capability);
    }
  }

  wrapTool(toolName, handler) {
    return async (params, context) => {
      try {
        await this.enforceCapability(toolName);
      } catch (error) {
        printError(`Capability enforcement blocked ${toolName}: ${error.message}`);
        return {
          content: [
            { type: 'text', text: `❌ ${toolName} blocked: ${error.message}` },
          ],
        };
      }

      return handler(params, context);
    };
  }
}

export const capabilitiesRouter = new CapabilitiesRouter();
export { CapabilitiesRouter };
