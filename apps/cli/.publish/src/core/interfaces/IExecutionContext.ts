export interface IExecutionContext {
  sessionId: string;
  userId?: string;
  requestId: string;
  parentExecutionId?: string;
  metadata: ContextMetadata;
  deadline?: Date;
  cancellationToken?: CancellationToken;
}

export interface ContextMetadata {
  source: string;
  ip?: string;
  userAgent?: string;
  tags?: string[];
  customData?: Record<string, unknown>;
}

export interface CancellationToken {
  isCancelled: boolean;
  onCancel(callback: () => void): void;
  cancel(): void;
}
