export class UltraAgent {
  constructor(config: { template: string; llm: string; mode: string }) {
    this.config = config;
  }

  config: { template: string; llm: string; mode: string };

  async fill() {
    return { status: 'ok' };
  }

  async execute() {
    return { status: 'ok' };
  }
}
