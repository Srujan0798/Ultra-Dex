// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Ticket Agent module
 * @module background/ticket-agent
 */

import { EventEmitter } from 'node:events';
import fs from 'fs/promises';
import path from 'path';
import { printInfo, printWarning } from '../utils/output.js';

const DEFAULT_INTERVAL_MS = 30000;

async function loadTickets(sourcePath) {
  if (!sourcePath) return [];
  try {
    const raw = await fs.readFile(sourcePath, 'utf8');
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data;
    return data.tickets || [];
  } catch {
    return [];
  }
}

export class TicketAgent extends EventEmitter {
  constructor(options = {}) {
    super();
    this.source = options.source || null;
    this.intervalMs = options.intervalMs || DEFAULT_INTERVAL_MS;
    this.timer = null;
    this.running = false;
  }

  async start() {
    if (this.running) return;
    this.running = true;
    printInfo('Background ticket agent started.');

    this.timer = setInterval(async () => {
      const tickets = await loadTickets(this.source);
      if (!tickets.length) {
        printWarning('No tickets found.');
        return;
      }
      tickets.forEach((ticket) => this.emit('ticket', ticket));
    }, this.intervalMs);
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.running = false;
  }
}

export function defaultTicketSource(projectRoot = process.cwd()) {
  return path.join(projectRoot, '.ultra-dex', 'tickets.json');
}
