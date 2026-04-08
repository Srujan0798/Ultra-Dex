export class AutonomousAgent {
  async setGoal(desc: string): Promise<string> {
    return `Goal set: ${desc}`;
  }
}
export const autonomousAgent = new AutonomousAgent();
