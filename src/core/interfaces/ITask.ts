export type TaskType =
  | 'code-generation'
  | 'code-review'
  | 'refactoring'
  | 'debugging'
  | 'documentation'
  | 'testing'
  | 'architecture'
  | 'deployment'
  | 'general';

export type TaskPriority = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface ITask {
  id: string;
  type: TaskType;
  description: string;
  payload: TaskPayload;
  priority: TaskPriority;
  requiredCapabilities: string[];
  deadline?: Date;
  metadata?: TaskMetadata;
}

export type TaskPayload =
  | CodeGenerationPayload
  | CodeReviewPayload
  | RefactoringPayload
  | DebuggingPayload
  | GeneralPayload;

export interface CodeGenerationPayload {
  language: string;
  framework?: string;
  requirements: string[];
  context?: string;
}

export interface CodeReviewPayload {
  filePaths: string[];
  focusAreas?: string[];
  prNumber?: number;
}

export interface RefactoringPayload {
  targetFiles: string[];
  refactoringType: string;
  constraints?: string[];
}

export interface DebuggingPayload {
  errorMessage: string;
  stackTrace?: string;
  reproductionSteps?: string[];
}

export interface GeneralPayload {
  query: string;
  context?: Record<string, unknown>;
}

export interface TaskMetadata {
  source: string;
  userId?: string;
  sessionId?: string;
  correlationId?: string;
  tags?: string[];
}
