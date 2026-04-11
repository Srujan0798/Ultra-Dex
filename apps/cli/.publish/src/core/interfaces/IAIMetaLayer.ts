export interface AIMessage {
  role: string;
  content: string;
}

export interface IAIMetaLayer {
  call(
    model: string | null,
    messages: AIMessage[],
    options?: Record<string, unknown>
  ): Promise<unknown>;
  stream(
    model: string | null,
    messages: AIMessage[],
    options?: Record<string, unknown>
  ): Promise<unknown>;
  generateObject(
    model: string | null,
    messages: AIMessage[],
    schema: unknown,
    options?: Record<string, unknown>
  ): Promise<unknown>;
  generateTextWithTools(
    model: string | null,
    messages: AIMessage[],
    tools: Record<string, unknown>,
    options?: Record<string, unknown>
  ): Promise<unknown>;
  setRateLimiter(rateLimiter: unknown): this;
  setStreamPipeline(streamPipeline: unknown): this;
}
