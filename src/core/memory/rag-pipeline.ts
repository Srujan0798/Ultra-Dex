// RAG Pipeline for memory-enhanced agent prompts
export class RAGPipeline {
  private memory: any;

  constructor(memory?: any) {
    this.memory = memory || { store: () => Promise.resolve(), search: () => Promise.resolve([]) };
  }

  /**
   * Retrieve relevant context from memory based on task similarity
   */
  async retrieveContext(task: string, agent: string, topK: number = 5): Promise<string[]> {
    const contexts: string[] = [];

    try {
      // Search by task similarity
      const taskResults = await this.searchByTask(task, topK);
      contexts.push(...taskResults);

      // Search by agent role
      const agentResults = await this.searchByAgent(agent, Math.floor(topK / 2));
      contexts.push(...agentResults);

      // Deduplicate
      return [...new Set(contexts)].slice(0, topK);
    } catch (error) {
      console.warn('[RAG] Failed to retrieve context:', error);
      return [];
    }
  }

  /**
   * Augment system prompt with retrieved context
   */
  augmentPrompt(systemPrompt: string, contexts: string[]): string {
    if (contexts.length === 0) {
      return systemPrompt;
    }

    const contextSection = this.formatContextSection(contexts);
    return `${systemPrompt}\n\n${contextSection}`;
  }

  /**
   * Store execution result in memory
   */
  async storeResult(task: string, agent: string, result: any): Promise<void> {
    try {
      const entry = {
        task,
        agent,
        result: this.summarizeResult(result),
        timestamp: Date.now(),
      };

      await this.memory.store(`rag:${agent}:${Date.now()}`, entry);
    } catch (error) {
      console.warn('[RAG] Failed to store result:', error);
    }
  }

  /**
   * Calculate relevance score between query and memory entry
   */
  relevanceScore(query: string, memory: string): number {
    // Simple cosine similarity approximation
    const queryWords = new Set(query.toLowerCase().split(/\s+/));
    const memoryWords = new Set(memory.toLowerCase().split(/\s+/));

    const intersection = new Set([...queryWords].filter((x: string) => memoryWords.has(x)));
    const union = new Set([...queryWords, ...memoryWords]);

    return intersection.size / union.size;
  }

  private async searchByTask(task: string, limit: number): Promise<string[]> {
    // Semantic search on task description
    const results: any[] = (await this.memory.search(task, limit)) || [];
    return results.map((r: any) => r.value?.result || '').filter(Boolean);
  }

  private async searchByAgent(agent: string, limit: number): Promise<string[]> {
    // Search for past executions by same agent
    const results: any[] = (await this.memory.search(agent, limit)) || [];
    return results
      .filter((r: any) => r.value?.agent === agent)
      .map((r: any) => r.value?.result || '')
      .filter(Boolean);
  }

  private formatContextSection(contexts: string[]): string {
    const formatted = contexts.map((ctx, i) => {
      const similarity = (0.9 - i * 0.1).toFixed(2);
      return `### Past Execution ${i + 1} (similarity: ${similarity})\n${ctx}\n---`;
    });

    return `## Relevant Past Context\n\nThe following past executions are relevant to your current task:\n\n${formatted.join('\n\n')}`;
  }

  private summarizeResult(result: any): string {
    if (typeof result === 'string') {
      return result.slice(0, 500); // Limit to 500 chars
    }
    return JSON.stringify(result).slice(0, 500);
  }
}
