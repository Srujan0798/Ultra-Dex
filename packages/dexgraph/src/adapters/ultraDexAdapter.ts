import {
  ExecutionAdapter,
  ExecutionContext,
  ExecutionResult,
} from '../executionAdapter.js';

/**
 * UltraDexAdapter bridges DexGraph's ExecutionAdapter interface
 * to the @ultra-dex/sdk client, enabling workflow nodes to route
 * AI calls dynamically across providers.
 */
export class UltraDexAdapter implements ExecutionAdapter {
  private inFlight: Map<
    string,
    { abort: () => void; running: boolean; progress: number }
  > = new Map();

  constructor(private client: any) {}

  name(): string {
    return 'UltraDexAdapter';
  }

  async run(context: ExecutionContext): Promise<ExecutionResult> {
    const startTime = Date.now();
    let aborted = false;

    const controller = {
      abort: () => {
        aborted = true;
      },
    };

    this.inFlight.set(context.nodeId, {
      abort: controller.abort,
      running: true,
      progress: 0,
    });

    try {
      const messages = this.buildMessages(context.input);
      const opts: any = {};

      if (context.input && typeof context.input === 'object') {
        const input = context.input as Record<string, unknown>;
        if (input.provider && typeof input.provider === 'string') {
          opts.provider = input.provider;
        }
        if (input.model && typeof input.model === 'string') {
          opts.model = input.model;
        }
      }

      if (aborted) {
        throw new Error('Task cancelled before execution');
      }

      this.inFlight.set(context.nodeId, {
        abort: controller.abort,
        running: true,
        progress: 50,
      });

      const response = await this.client.chat(messages, opts);
      const duration = Date.now() - startTime;

      this.inFlight.set(context.nodeId, {
        abort: controller.abort,
        running: false,
        progress: 100,
      });

      const content =
        typeof response.content === 'string'
          ? response.content
          : JSON.stringify(response.content);

      return {
        status: 'SUCCESS',
        output: {
          content,
          provider: response.provider || 'unknown',
          model: response.model || 'unknown',
          usage: response.usage || {},
        },
        logs: [
          `UltraDex chat completed via ${response.provider || 'unknown'}`,
          `Duration: ${duration}ms`,
        ],
        cost: {
          tokens: response.usage?.totalTokens ?? 0,
          estimatedUSD: response.cost ?? 0,
          provider: response.provider || 'unknown',
        },
        confidence: 0.95,
        duration,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      const msg = error instanceof Error ? error.message : String(error);

      this.inFlight.set(context.nodeId, {
        abort: controller.abort,
        running: false,
        progress: 0,
      });

      return {
        status: aborted ? 'CANCELLED' : 'FAILED',
        logs: [aborted ? 'Task was cancelled' : `UltraDex chat failed: ${msg}`],
        error: msg,
        cost: { tokens: 0, estimatedUSD: 0, provider: 'unknown' },
        confidence: 0,
        duration,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async cancel(nodeId: string): Promise<void> {
    const task = this.inFlight.get(nodeId);
    if (task) {
      task.abort();
      task.running = false;
    }
  }

  async status(nodeId: string): Promise<{ running: boolean; progress?: number }> {
    const task = this.inFlight.get(nodeId);
    if (!task) return { running: false, progress: 0 };
    return { running: task.running, progress: task.progress };
  }

  private buildMessages(input: unknown): any[] {
    if (Array.isArray(input)) {
      // Assume it's already a messages array
      return input as any[];
    }

    if (input && typeof input === 'object') {
      const obj = input as Record<string, unknown>;

      if (Array.isArray(obj.messages)) {
        return obj.messages as any[];
      }

      const content =
        typeof obj.prompt === 'string'
          ? obj.prompt
          : typeof obj.content === 'string'
          ? obj.content
          : JSON.stringify(obj);

      return [{ role: 'user', content }];
    }

    return [{ role: 'user', content: String(input) }];
  }
}
