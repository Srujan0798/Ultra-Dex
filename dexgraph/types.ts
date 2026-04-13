// DexGraph Workflow DSL — Type Definitions

export interface WorkflowDefinition {
  version: 'dexgraph/v1';
  name: string;
  description: string;
  context: Record<string, any>;
  tasks: TaskDefinition[];
  on_failure: { retry: number; rollback: boolean };
}

export interface TaskDefinition {
  id: string;
  role: 'architect' | 'engineer' | 'tester' | 'reviewer';
  instruction: string;
  depends_on?: string[];
  context?: Record<string, any>;
  output?: string;
  verify?: VerificationRule;
  parallel?: boolean;
}

export interface VerificationRule {
  type: 'unit_test' | 'llm_check' | 'file_exists' | 'custom';
  command?: string;
  policy?: string;
}

export interface GraphNode {
  id: string;
  role: TaskDefinition['role'];
  instruction: string;
  dependencies: string[];
  context: Record<string, any>;
  output?: string;
  verification?: VerificationRule;
  parallel: boolean;
  state: NodeState;
}

export type NodeState =
  | 'CREATED'
  | 'READY'
  | 'RUNNING'
  | 'VERIFYING'
  | 'SUCCESS'
  | 'FAILED'
  | 'RETRY'
  | 'BLOCKED'
  | 'ROLLBACK';

export interface GraphEdge {
  from: string;
  to: string;
}

export interface DexGraphResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    name: string;
    description: string;
    context: Record<string, any>;
  };
}
