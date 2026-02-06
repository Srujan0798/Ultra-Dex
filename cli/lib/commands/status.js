// Copyright (c) 2026 Ultra-Dex

import { registerStatusCommand as register } from './state.js';

export function registerStatusCommand(program) {
  return register(program);
}

export default { registerStatusCommand };
