export class ContextCollector {
  /**
   * Collect all dependency outputs into a context object
   */
  static collect(
    dependencyOutputs: Record<string, unknown>,
    currentInput: Record<string, unknown>
  ): Record<string, unknown> {
    // Dependency outputs take precedence over input
    return {
      ...currentInput,
      ...dependencyOutputs,
      _dependencies: dependencyOutputs
    };
  }

  /**
   * Extract specific fields from context
   */
  static extract(
    context: Record<string, unknown>,
    fieldNames: string[]
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const field of fieldNames) {
      result[field] = context[field];
    }
    return result;
  }
}
