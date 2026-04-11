// Plugin system types and interfaces

export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  agents: AgentDef[];
  tools: ToolDef[];
  hooks?: {
    onInstall?: string;
    onUninstall?: string;
    beforeTask?: string;
    afterTask?: string;
  };
  dependencies: string[];
  minUltraDexVersion: string;
}

export interface AgentDef {
  role: string;
  model?: string;
  systemPrompt: string;
  capabilities: string[];
  costTier: 'free' | 'standard' | 'premium';
  providers?: string[];
}

export interface ToolDef {
  name: string;
  description: string;
  schema: object;
  handler: string;
}

export interface InstalledPlugin {
  manifest: PluginManifest;
  path: string;
  installedAt: Date;
  status: 'active' | 'inactive' | 'error';
  errors?: string[];
}

export type HookName = 'onInstall' | 'onUninstall' | 'beforeTask' | 'afterTask';

export interface HookContext {
  task?: string;
  agent?: string;
  provider?: string;
  result?: any;
  error?: Error;
}
