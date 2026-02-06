// Copyright (c) 2026 Ultra-Dex

import { detectFailureType, suggestStrategy } from './strategies.js';

export class CiHealer {
  constructor(options = {}) {
    this.maxAttempts = options.maxAttempts || 3;
  }

  analyze(logs) {
    const type = detectFailureType(logs);
    const suggestion = suggestStrategy(type);
    return { type, suggestion };
  }
}

export default CiHealer;
