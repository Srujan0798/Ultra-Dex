// Copyright (c) 2026 Ultra-Dex

import { registerRiskCommand as register } from '../quality/risk-register.js';

export function registerRiskCommand(program) {
  register(program);
}

export default { registerRiskCommand };
