// YAML workflow DSL → DexGraphResult
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import {
  WorkflowDefinition,
  TaskDefinition,
  GraphNode,
  GraphEdge,
  DexGraphResult,
  VerificationRule,
} from './types.js';

// ── Errors ──────────────────────────────────────────────

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

export class GraphError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GraphError';
  }
}

export class StateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StateError';
  }
}

import { validateWorkflow } from './schema.js';

// ── YAML Loader ─────────────────────────────────────────

export function loadYAML(filepath: string): WorkflowDefinition {
  const absolute = path.resolve(filepath);
  if (!fs.existsSync(absolute)) {
    throw new ParseError(`File not found: ${filepath}`);
  }

  const raw = fs.readFileSync(absolute, 'utf-8');
  // SECURITY: Use SAFE_SCHEMA to prevent RCE via malicious YAML (H-002)
  const doc = yaml.load(raw, { schema: yaml.JSON_SCHEMA });

  if (doc === null || typeof doc !== 'object' || Array.isArray(doc)) {
    throw new ParseError('YAML root must be a mapping');
  }

  const result = validateWorkflow(doc);
  if (!result.valid) {
    throw new ParseError(`Workflow validation failed: ${result.errors.join('; ')}`);
  }

  return doc as WorkflowDefinition;
}

// ── Dependency Extraction ───────────────────────────────

function extractDependencies(
  tasks: TaskDefinition[],
  taskIds: Set<string>
): GraphEdge[] {
  const edges: GraphEdge[] = [];

  for (const task of tasks) {
    // Explicit depends_on edges
    for (const dep of task.depends_on ?? []) {
      if (dep === task.id) {
        throw new GraphError(`Self-dependency: task "${task.id}" depends on itself`);
      }
      if (!taskIds.has(dep)) {
        throw new GraphError(
          `Unknown dependency: task "${task.id}" depends on "${dep}" which does not exist`
        );
      }
      edges.push({ from: dep, to: task.id });
    }

    // Implicit edges from {{taskId.output}} template refs in context
    if (task.context) {
      for (const value of Object.values(task.context) as string[]) {
        const refs = extractTemplateRefs(value);
        for (const ref of refs) {
          if (!taskIds.has(ref)) {
            throw new GraphError(
              `Unknown template ref "{{${ref}.output}}" in task "${task.id}"`
            );
          }
          edges.push({ from: ref, to: task.id });
        }
      }
    }
  }

  return edges;
}

function extractTemplateRefs(value: string): string[] {
  const refs: string[] = [];
  const pattern = /\{\{(\w+)\.output\}\}/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(value)) !== null) {
    refs.push(match[1]);
  }
  return refs;
}

// ── Template Resolution ─────────────────────────────────

export function resolveTemplates(
  tasks: TaskDefinition[]
): TaskDefinition[] {
  return tasks.map((task) => {
    const resolved = { ...task };

    // Replace {{taskId.output}} with placeholder markers in instruction
    resolved.instruction = resolved.instruction.replace(
      /\{\{(\w+)\.output\}\}/g,
      (_match: string, taskId: string) => `__output:${taskId}__`
    );

    // Resolve context template refs
    if (resolved.context) {
      const ctx: Record<string, string> = {};
      for (const [key, value] of Object.entries(resolved.context)) {
        ctx[key] = String(value as string | number | boolean).replace(
          /\{\{(\w+)\.output\}\}/g,
          (_match: string, taskId: string) => `__output:${taskId}__`
        );
      }
      resolved.context = ctx;
    }

    return resolved;
  });
}

// ── Task → GraphNode Conversion ─────────────────────────

function taskToNode(task: TaskDefinition, dependencies: string[]): GraphNode {
  return {
    id: task.id,
    role: task.role,
    instruction: task.instruction,
    dependencies,
    context: task.context ?? {},
    output: task.output,
    verification: task.verify,
    parallel: task.parallel ?? false,
    state: 'CREATED',
  };
}

function getDirectDependencies(task: TaskDefinition): string[] {
  return [...(task.depends_on ?? [])];
}

// ── Main Parse Function ─────────────────────────────────

export function parse(filepath: string): DexGraphResult {
  const def = loadYAML(filepath);
  const taskIds = new Set<string>(def.tasks.map((t: TaskDefinition) => t.id));

  // Resolve templates
  const resolved = resolveTemplates(def.tasks);

  // Build edges (from explicit deps + template refs in original tasks)
  const edges = extractDependencies(def.tasks, taskIds);

  // Build nodes
  const nodes = resolved.map((task) => {
    const deps = getDirectDependencies(task);
    return taskToNode(task, deps);
  });

  return {
    nodes,
    edges,
    metadata: {
      name: def.name,
      description: def.description ?? '',
      context: def.context ?? {},
    },
  };
}
