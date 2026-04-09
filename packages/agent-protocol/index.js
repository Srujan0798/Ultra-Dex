// Copyright (c) 2026 Ultra-Dex

/**
 * Ultra-Dex Agent Protocol (v6.0.0)
 * Standardized communication and behavior for autonomous agents.
 */

// Legacy UltraAgent (kept for backwards compatibility)
export class UltraAgent {
  constructor(options = {}) {
    this.options = options;
  }

  async fill({ section }) {
    return { section, status: 'filled' };
  }

  async execute(task) {
    return { task, status: 'executed' };
  }
}

// New BaseAgent protocol for v6.0.0
export class BaseAgent {
  constructor(name, tier, options = {}) {
    this.name = name;
    this.tier = tier;
    this.options = options;
    this.memory = options.memory; // Injected MemoryManager
    this.sandbox = options.sandbox; // Injected DockerSandbox
  }

  /**
   * Primary entry point for agent execution
   */
  async run(objective, context = {}) {
    console.log(`[${this.name}] Initializing objective: ${objective}`);

    // 1. Plan
    const plan = await this.plan(objective, context);

    // 2. Execute (with sandbox if required)
    const result = await this.execute(plan, context);

    // 3. Verify (Protocol 21)
    const verification = await this.verify(result);

    // 4. Record to Cold Memory
    if (this.memory && typeof this.memory.add === 'function') {
      await this.memory.add({
        content: `Agent ${this.name} completed objective: ${objective}`,
        type: 'decision',
        metadata: { result, verification },
      });
    }

    return { result, verification };
  }

  // Subclasses must implement these:

  async plan(_objective, _context) {
    throw new Error('Method "plan" must be implemented by subclass');
  }

  async execute(_plan, _context) {
    throw new Error('Method "execute" must be implemented by subclass');
  }

  // Default verification hook

  async verify(_result) {
    return { passed: true, steps: [] };
  }
}

export const PROTOCOL_VERSION = '6.0.0';

export default { UltraAgent, BaseAgent, PROTOCOL_VERSION };
