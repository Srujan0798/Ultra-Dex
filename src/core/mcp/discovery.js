// Copyright (c) 2026 Ultra-Dex
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import chalk from 'chalk';

/**
 * Capability Discovery Engine
 * Dynamically maps external tools into agent skills.
 */
export class DiscoveryEngine {
  constructor() {
    this.externalCapabilities = new Map();
  }

  async discover(serverConfig) {
    console.log(chalk.blue(`🔍 Discovery: Scanning MCP Server -> ${serverConfig.name}...`));
    
    try {
      const transport = new StdioClientTransport({
        command: serverConfig.command,
        args: serverConfig.args
      });

      const client = new Client({ name: 'ultra-dex-discovery', version: '1.0.0' }, { capabilities: {} });
      await client.connect(transport);

      const { tools } = await client.listTools();
      this.externalCapabilities.set(serverConfig.name, tools);
      
      console.log(chalk.green(`✅ Discovery: Unlocked ${tools.length} new capabilities.`));
      return tools;
    } catch (e) {
      console.error(chalk.red(`❌ Discovery Failed: ${e.message}`));
      return [];
    }
  }
}

export const discovery = new DiscoveryEngine();

