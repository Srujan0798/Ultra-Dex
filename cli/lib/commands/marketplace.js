// Copyright (c) 2026 Ultra-Dex

import { registerMarketplaceCommands } from '../marketplace/index.js';

export function registerMarketplaceCommand(program) {
  return registerMarketplaceCommands(program);
}

export default {
  registerMarketplaceCommand,
};
