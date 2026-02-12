/**
 * Ultra-Dex Plugins Index
 * Centralized export for all plugins
 */

// Official plugins
export { default as CursorPlugin } from './cursor/index.js';
export { default as ClinePlugin } from './cline/index.js';
export { default as ContinueDevPlugin } from './continue.dev/index.js';
export { default as WindsurfPlugin } from './windsurf/index.js';
export { default as DockerPlugin } from './docker/index.js';
export { default as JetBrainsPlugin } from './jetbrains/index.js';
export { default as NeovimPlugin } from './neovim/index.js';
export { default as SlackPlugin } from './slack/index.js';
export { default as ClerkPlugin } from './clerk/index.js';
export { default as VizPlugin } from './viz/index.js';
export { default as LoggerPlugin } from './logger/index.js';

// Plugin registry
export const PLUGINS = {
  cursor: '@ultra-dex/cursor',
  cline: '@ultra-dex/cline',
  'continue.dev': '@ultra-dex/continue.dev',
  windsurf: '@ultra-dex/windsurf',
  docker: '@ultra-dex/docker',
  jetbrains: '@ultra-dex/jetbrains',
  neovim: '@ultra-dex/neovim',
  slack: '@ultra-dex/slack',
  clerk: '@ultra-dex/clerk',
  viz: '@ultra-dex/viz',
  logger: '@ultra-dex/logger',
};

export default PLUGINS;
