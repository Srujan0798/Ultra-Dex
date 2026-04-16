export interface PlanStep {
  task: string;
  status?: string;
  [key: string]: unknown;
}

export interface PlanPhase {
  steps: PlanStep[];
  [key: string]: unknown;
}

export interface PlanState {
  project?: {
    name: string;
    mode: string;
  };
  phases?: PlanPhase[];
  updatedAt?: string;
  [key: string]: unknown;
}

export function loadState(): Promise<PlanState | null>;
export function saveState(state: PlanState): Promise<void>;
export function parsePlanFromMarkdown(): Promise<PlanPhase[]>;
export function generateMarkdown(state: PlanState): string;
