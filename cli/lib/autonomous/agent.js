import { AutonomousPipeline } from './pipeline.js';

export class AutonomousAgent {
  constructor(options = {}) {
    this.pipeline = new AutonomousPipeline(options);
  }

  async execute(description, approvals = []) {
    return await this.pipeline.run(description, approvals);
  }
}
