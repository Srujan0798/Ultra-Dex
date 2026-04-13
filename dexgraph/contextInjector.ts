import { DexGraph } from './graph.js';
import { WorkflowStore } from '../memory/workflowStore.js';
import { ContextCollector } from '../memory/contextCollector.js';

export class ContextInjector {
  constructor(
    private graph: DexGraph,
    private store: WorkflowStore,
    private workflowId: string
  ) {}

  /**
   * Collect outputs from all dependencies of a node
   */
  collectDependencyOutputs(nodeId: string): Record<string, unknown> {
    const node = this.graph.getNode(nodeId);
    if (!node) throw new Error(`Node not found: ${nodeId}`);

    const dependencyIds = this.graph.getDependencies(nodeId);
    const outputs = this.store.getDependencyOutputs(
      this.workflowId,
      nodeId,
      dependencyIds
    );

    return outputs;
  }

  /**
   * Check if all dependencies are completed (SUCCESS state)
   */
  areDependenciesSatisfied(nodeId: string): boolean {
    const node = this.graph.getNode(nodeId);
    if (!node) throw new Error(`Node not found: ${nodeId}`);

    const dependencyIds = this.graph.getDependencies(nodeId);
    const workflow = this.store.getWorkflow(this.workflowId);
    if (!workflow) return false;

    return dependencyIds.every(depId => {
      const depNode = workflow.nodes.get(depId);
      return depNode?.state === 'SUCCESS';
    });
  }

  /**
   * Wait for dependencies to complete (polling)
   */
  async waitForDependencies(
    nodeId: string,
    timeoutMs: number = 300000
  ): Promise<Record<string, unknown>> {
    const startTime = Date.now();
    const pollInterval = 100; // ms

    while (Date.now() - startTime < timeoutMs) {
      if (this.areDependenciesSatisfied(nodeId)) {
        return this.collectDependencyOutputs(nodeId);
      }
      await this.sleep(pollInterval);
    }

    throw new Error(
      `Timeout waiting for dependencies of ${nodeId} after ${timeoutMs}ms`
    );
  }

  /**
   * Get node's static input
   */
  getNodeInput(nodeId: string): Record<string, unknown> {
    const node = this.graph.getNode(nodeId);
    return node?.context || {};
  }

  /**
   * Build injection metadata for node
   */
  buildInjectionMetadata(nodeId: string): {
    dependencyOutputs: Record<string, unknown>;
    injectedContext: Record<string, unknown>;
    staticInput: Record<string, unknown>;
  } {
    const dependencyOutputs = this.collectDependencyOutputs(nodeId);
    const staticInput = this.getNodeInput(nodeId);

    // Merge with dependency outputs taking precedence
    const injectedContext = ContextCollector.collect(
      dependencyOutputs,
      staticInput
    );

    return { dependencyOutputs, injectedContext, staticInput };
  }

  /**
   * Inject context into node for execution
   * Modifies node.metadata with injection info
   */
  injectContext(nodeId: string): void {
    const node = this.graph.getNode(nodeId);
    if (!node) throw new Error(`Node not found: ${nodeId}`);

    const { dependencyOutputs, injectedContext, staticInput } =
      this.buildInjectionMetadata(nodeId);

    // Store injection metadata on node. Using context since metadata doesn't exist on GraphNode
    if (!node.context) node.context = {};
    node.context.contextInjection = {
      dependencyOutputs,
      injectedContext,
      staticInput,
      injectedAt: new Date().toISOString(),
      dependencies: this.graph.getDependencies(nodeId)
    };
  }

  /**
   * Build execution context with injected values
   * Called by dispatcher before passing to adapter
   */
  buildExecutionContext(nodeId: string): Record<string, unknown> {
    const node = this.graph.getNode(nodeId);
    if (!node) throw new Error(`Node not found: ${nodeId}`);

    // If context not yet injected, inject now
    const contextInjection = node.context?.contextInjection;
    if (!contextInjection) {
      this.injectContext(nodeId);
      return (node.context!.contextInjection as any).injectedContext;
    }

    // Execution context includes injected values
    return (contextInjection as any).injectedContext;
  }

  /**
   * Verify context is ready for execution
   */
  isContextReady(nodeId: string): boolean {
    const node = this.graph.getNode(nodeId);
    if (!node) return false;
    
    // Context ready if: all deps satisfied AND (has injection OR no deps)
    const hasDeps = this.graph.getDependencies(nodeId).length > 0;
    const depsReady = this.areDependenciesSatisfied(nodeId);
    const hasInjection = !!node.context?.contextInjection;

    return depsReady || (!hasDeps && hasInjection);
  }

  /**
   * Propagate context from node to all dependents
   */
  propagateContext(nodeId: string): void {
    const node = this.graph.getNode(nodeId);
    if (!node || node.state !== 'SUCCESS') return;

    const dependents = this.graph.getDependents(nodeId);
    for (const depId of dependents) {
      // Mark dependent as ready for context injection
      const depNode = this.graph.getNode(depId);
      if (depNode && depNode.state === 'READY') {
        // Don't inject yet; wait for all deps
        // But mark that this dependency is satisfied
        if (!depNode.context) depNode.context = {};
        if (!depNode.context.readyDependencies) {
          depNode.context.readyDependencies = [];
        }
        const readyDeps = depNode.context.readyDependencies as string[];
        if (!readyDeps.includes(nodeId)) {
          readyDeps.push(nodeId);
        }
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}
