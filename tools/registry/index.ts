/**
 * DexGraph Tool Registry
 *
 * Registers callable tools that agents can invoke during task execution.
 * Tools are pure functions with typed input/output schemas.
 * The registry resolves tools by name, validates inputs, and returns results.
 *
 * This implements the tool protocol layer required for Phase 0.
 */

// ──────────────────────────────────────────────────────────────────────────────
// Tool types
// ──────────────────────────────────────────────────────────────────────────────

export interface ToolSchema {
  name: string;
  description: string;
  inputSchema: Record<string, { type: string; required?: boolean; description?: string }>;
  outputSchema?: Record<string, { type: string; description?: string }>;
}

export interface ToolResult {
  success: boolean;
  output?: unknown;
  error?: string;
  durationMs: number;
}

export type ToolHandler = (input: Record<string, unknown>) => Promise<unknown>;

export interface RegisteredTool {
  schema: ToolSchema;
  handler: ToolHandler;
  registeredAt: string;
  callCount: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// ToolRegistry
// ──────────────────────────────────────────────────────────────────────────────

export class ToolRegistry {
  private tools: Map<string, RegisteredTool> = new Map();

  /**
   * Register a tool with its schema and handler.
   * @throws if a tool with the same name is already registered
   */
  register(schema: ToolSchema, handler: ToolHandler): void {
    if (this.tools.has(schema.name)) {
      throw new Error(`Tool "${schema.name}" is already registered`);
    }
    this.tools.set(schema.name, {
      schema,
      handler,
      registeredAt: new Date().toISOString(),
      callCount: 0,
    });
  }

  /**
   * Unregister a tool by name.
   */
  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  /**
   * Check if a tool is registered.
   */
  has(name: string): boolean {
    return this.tools.has(name);
  }

  /**
   * Get the schema for a tool.
   * @throws if tool is not registered
   */
  getSchema(name: string): ToolSchema {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Tool "${name}" is not registered`);
    return tool.schema;
  }

  /**
   * Execute a tool by name with input validation.
   * @throws if tool is not registered
   */
  async execute(name: string, input: Record<string, unknown>): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return { success: false, error: `Tool "${name}" is not registered`, durationMs: 0 };
    }

    // Validate required inputs
    const missingFields = Object.entries(tool.schema.inputSchema)
      .filter(([_k, v]) => v.required && input[_k] === undefined)
      .map(([k]) => k);

    if (missingFields.length > 0) {
      return {
        success: false,
        error: `Missing required input fields: ${missingFields.join(', ')}`,
        durationMs: 0,
      };
    }

    const startMs = Date.now();
    try {
      const output = await tool.handler(input);
      tool.callCount++;
      return { success: true, output, durationMs: Date.now() - startMs };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        durationMs: Date.now() - startMs,
      };
    }
  }

  /**
   * List all registered tool names.
   */
  listTools(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Get all tool schemas (for agent tool discovery).
   */
  listSchemas(): ToolSchema[] {
    return Array.from(this.tools.values()).map(t => t.schema);
  }

  /**
   * Get call statistics for all tools.
   */
  getStats(): Record<string, { callCount: number; registeredAt: string }> {
    const stats: Record<string, { callCount: number; registeredAt: string }> = {};
    for (const [name, tool] of this.tools.entries()) {
      stats[name] = { callCount: tool.callCount, registeredAt: tool.registeredAt };
    }
    return stats;
  }

  /** Total number of registered tools */
  get size(): number {
    return this.tools.size;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Global registry singleton
// ──────────────────────────────────────────────────────────────────────────────

let _globalRegistry: ToolRegistry | undefined;

/** Get (or create) the process-global ToolRegistry singleton */
export function getGlobalToolRegistry(): ToolRegistry {
  if (!_globalRegistry) _globalRegistry = new ToolRegistry();
  return _globalRegistry;
}
