// Copyright (c) 2026 Ultra-Dex

import boxen from '../utils/boxen.js';
import chalk from 'chalk';
import { renderGradient } from '../ui/gradients.js';

export const doomsdayTheme = {
  name: 'doomsday',
  primary: '#dc2626',
  secondary: '#7c3aed',
  accent: '#f59e0b',
  message: 'The Multiverse of Code has a new defender.',
};

export function renderDoomsdayBanner() {
  const banner = `
 █████╗ ██╗   ██╗███████╗███╗   ██╗ ██████╗ ███████╗██████╗ ███████╗
██╔══██╗██║   ██║██╔════╝████╗  ██║██╔════╝ ██╔════╝██╔══██╗██╔════╝
███████║██║   ██║█████╗  ██╔██╗ ██║██║  ███╗█████╗  ██████╔╝███████╗
██╔══██║██║   ██║██╔══╝  ██║╚██╗██║██║   ██║██╔══╝  ██╔══██╗╚════██║
██║  ██║╚██████╔╝███████╗██║ ╚████║╚██████╔╝███████╗██║  ██║███████║
╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝

AVENGERS ASSEMBLE · ULTRA-DEX DOOMSDAY PROTOCOL
`;

  return renderGradient(banner, 'doomsday');
}

export function showHelp() {
  const content = [
    renderDoomsdayBanner(),
    '',
    chalk.bold('⚡ ASSEMBLE THE CODE'),
    '  init     Bootstrap a project',
    '  generate Create plans & code',
    '',
    chalk.bold('🛡️ DEFEND THE REALM'),
    '  review   Audit the implementation',
    '  verify   Run the 21-step protocol',
    '',
    chalk.bold('💎 HARNESS INFINITY'),
    '  serve    Open the Multiverse Portal',
    '  cloud    Deploy via provider wrappers',
    '',
    chalk.gray(doomsdayTheme.message),
  ].join('\n');

  console.log(
    boxen(content, {
      padding: 1,
      margin: 1,
      borderStyle: 'double',
      borderColor: 'red',
    })
  );
}

export function showSwarmAssemble(activeAgents = []) {
  const header = renderGradient('⚡ ASSEMBLING THE AVENGERS', 'doomsday');
  console.log(header);
  if (!activeAgents.length) return;
  activeAgents.forEach((agent) => {
    const label = agent?.name ? agent.name.toUpperCase() : 'AGENT';
    console.log(renderGradient(`  ${label}`, 'doomsday'));
  });
  console.log('');
}

export default {
  doomsdayTheme,
  renderDoomsdayBanner,
  showHelp,
  showSwarmAssemble,
};

/**
 * Handle errors in doomsday module
 * @param {Error} error - The error to handle
 * @param {string} [context='doomsday'] - Error context
 */
function handleModuleError(error, context = 'doomsday') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
