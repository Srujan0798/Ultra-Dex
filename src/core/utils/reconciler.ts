var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (
  decorators: Function[],
  target: object,
  key: PropertyKey = '',
  kind: number = 0
) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i]))
      result = (
        kind
          ? (decorator as (value: object, propertyKey: PropertyKey, descriptor?: unknown) => unknown)(
              target,
              key,
              result
            )
          : (decorator as (value: object) => unknown)(result as object)
      ) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { singleton } from 'tsyringe';
import { projectGraph } from '../mcp/graph.js';
import { loadState } from '../commands/plan.js';
import { logger } from './logging.js';

interface PlanStep {
  task: string;
  status?: string;
}

interface ReconciliationResults {
  score: number;
  totalTasks: number;
  verifiedTasks: number;
  hallucinatedTasks: PlanStep[];
  missingTasks: PlanStep[];
  details: unknown[];
}

interface LegacyProjectGraph {
  scan(): Promise<void>;
  nodes: Map<string, { type: string }>;
  findSymbol?(symbolName: string): unknown[];
}

// TODO: replace with typed graph access once `src/core/mcp/graph.ts` is migrated.
const typedProjectGraph = projectGraph as unknown as LegacyProjectGraph;

let Reconciler = class {
  async reconcile(): Promise<ReconciliationResults | null> {
    const state = await loadState();
    if (!state || !state.phases) return null;
    await typedProjectGraph.scan();
    const results: ReconciliationResults = {
      score: 0,
      totalTasks: 0,
      verifiedTasks: 0,
      hallucinatedTasks: [],
      // Marked as completed but not found
      missingTasks: [],
      // Not marked as completed but found markers
      details: [],
    };
    for (const phase of state.phases) {
      for (const step of phase.steps) {
        results.totalTasks++;
        if (step.status === 'completed') {
          const isVerified = await this.verifyTask(step);
          if (isVerified) {
            results.verifiedTasks++;
          } else {
            results.hallucinatedTasks.push(step);
          }
        }
      }
    }
    results.score =
      results.totalTasks > 0 ? Math.round((results.verifiedTasks / results.totalTasks) * 100) : 0;
    return results;
  }
  async verifyTask(step: PlanStep): Promise<boolean> {
    const task = step.task.toLowerCase();
    if (task.includes('database') || task.includes('schema') || task.includes('prisma')) {
      const dbFiles = Array.from(typedProjectGraph.nodes.keys()).filter(
        (f) =>
          f.includes('schema') ||
          f.includes('prisma') ||
          f.includes('database') ||
          f.includes('models')
      );
      if (dbFiles.length > 0) return true;
    }
    if (task.includes('api') || task.includes('endpoint') || task.includes('route')) {
      const apiFiles = Array.from(typedProjectGraph.nodes.keys()).filter(
        (f) =>
          f.includes('api/') ||
          f.includes('routes/') ||
          f.includes('route.ts') ||
          f.includes('route.js')
      );
      if (apiFiles.length > 0) return true;
    }
    if (task.includes('component') || task.includes('ui') || task.includes('page')) {
      const uiFiles = Array.from(typedProjectGraph.nodes.keys()).filter(
        (f) =>
          f.includes('components/') ||
          f.includes('pages/') ||
          f.includes('app/') ||
          f.includes('.tsx') ||
          f.includes('.jsx')
      );
      if (uiFiles.length > 0) return true;
    }
    const symbolMatch = step.task.match(/(?:Implement|Create|Add)\s+([A-Z][a-zA-Z0-9]+)/);
    if (symbolMatch) {
      const symbolName = symbolMatch[1];
      const found = typedProjectGraph.findSymbol?.(symbolName) ?? [];
      if (found.length > 0) return true;
    }
    return false;
  }
};
Reconciler = __decorateClass([singleton()], Reconciler) as typeof Reconciler;
const reconciler = new Reconciler();
async function _safeExecute<T>(
  fn: () => Promise<T>,
  context: string = 'reconciler'
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
    return null;
  }
}
export { Reconciler, reconciler };
