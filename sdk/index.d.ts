export declare class UltraAgent {
  constructor(options: {
    template: string;
    llm: string;
    mode: 'planner' | 'executor' | 'reviewer' | 'architect';
  });
  fill(payload: { idea: string; sections: number[] }): Promise<any>;
  generateTasks(payload: { from: string }): Promise<any[]>;
  execute(
    task: { id: string; title: string },
    options?: { verify?: boolean; autoCommit?: boolean }
  ): Promise<any>;
}
