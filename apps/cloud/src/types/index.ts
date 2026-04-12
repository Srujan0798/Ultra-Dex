// Ultra-Dex Cloud Types

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'member' | 'viewer';
  createdAt: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  capabilities: string[];
  provider?: string;
  status: 'active' | 'inactive';
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'running' | 'completed' | 'failed' | 'pending';
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  agent: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
  duration?: number;
}

export interface Provider {
  id: string;
  name: string;
  key: string;
  enabled: boolean;
  models: string[];
  defaultModel: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  path: string;
  lastModified: string;
}

export interface Run {
  id: string;
  agent: string;
  provider: string;
  status: 'running' | 'completed' | 'failed';
  duration: number;
  cost: number;
  tokens: { input: number; output: number };
  createdAt: string;
}

export interface NavItem {
  name: string;
  href: string;
  icon: string;
  badge?: string;
}
