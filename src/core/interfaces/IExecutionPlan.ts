import { ITask } from './ITask.js';

export type PlanStepStatus = 
  | 'pending'
  | 'in-progress'
  | 'completed'
  | 'failed'
  | 'skipped';

export interface IPlanStep {
  id: string;
  task: ITask;
  dependencies: string[];
  status: PlanStepStatus;
  result?: unknown;
  error?: string;
  startTime?: number;
  endTime?: number;
}

export interface IExecutionPlan {
  id: string;
  name: string;
  steps: IPlanStep[];
  parallelGroups: string[][];
  metadata: PlanMetadata;
}

export interface PlanMetadata {
  createdAt: Date;
  estimatedDuration: number;
  totalSteps: number;
  parallelizableSteps: number;
}
