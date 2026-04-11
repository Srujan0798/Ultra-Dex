export interface ITelemetryService {
  initialize(): Promise<void>;
  trackMetric(
    name: string,
    value: number,
    tags?: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<void>;
}
