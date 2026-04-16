/**
 * Docs-based Skill Loader
 *
 * Reads skill definitions from docs/skills/ markdown files and registers them
 * into the SkillRegistry. This makes all 86 skills from the Cowrk plugin
 * registry discoverable by any agent — not just the code-defined ones.
 *
 * Skills loaded from docs are "definition-only" — they have metadata and
 * prompt content but no hardcoded input/output schemas. The orchestrator
 * uses them for routing and context; execution uses the prompt template.
 */

import fs from 'node:fs';
import path from 'node:path';
import { SkillDefinition } from './types.js';
import { SkillRegistry } from './framework.js';

/** Plugin name → category mapping */
const PLUGIN_CATEGORY: Record<string, SkillDefinition['category']> = {
  engineering: 'engineering',
  'product-management': 'productivity',
  design: 'design',
  'pdf-viewer': 'operations',
  data: 'data',
  marketing: 'marketing',
  sales: 'sales',
  legal: 'legal',
  finance: 'finance',
  'slack-by-salesforce': 'productivity',
  productivity: 'productivity',
};

/** Plugin → default agent mapping */
const PLUGIN_AGENT: Record<string, { id: string; capabilities: string[] }> = {
  engineering: { id: 'backend', capabilities: ['code', 'architecture', 'debugging'] },
  'product-management': { id: 'planner', capabilities: ['planning', 'analysis', 'communication'] },
  design: { id: 'frontend', capabilities: ['ui', 'ux', 'accessibility'] },
  'pdf-viewer': { id: 'reviewer', capabilities: ['documents', 'review'] },
  data: { id: 'database', capabilities: ['sql', 'analytics', 'visualization'] },
  marketing: { id: 'planner', capabilities: ['content', 'campaigns', 'seo'] },
  sales: { id: 'planner', capabilities: ['outreach', 'pipeline', 'forecasting'] },
  legal: { id: 'reviewer', capabilities: ['contracts', 'compliance', 'risk'] },
  finance: { id: 'database', capabilities: ['accounting', 'audit', 'reporting'] },
  'slack-by-salesforce': { id: 'devops', capabilities: ['messaging', 'search'] },
  productivity: { id: 'planner', capabilities: ['tasks', 'memory', 'scheduling'] },
};

interface ParsedFrontmatter {
  name: string;
  description: string;
  'argument-hint'?: string;
  'user-invocable'?: string;
}

/**
 * Parse YAML frontmatter from a markdown file's content.
 * Returns null if no valid frontmatter found.
 */
function parseFrontmatter(content: string): ParsedFrontmatter | null {
  if (!content.startsWith('---')) return null;

  const endIdx = content.indexOf('---', 3);
  if (endIdx === -1) return null;

  const yaml = content.slice(3, endIdx).trim();
  const result: Record<string, string> = {};

  for (const line of yaml.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    result[key] = value;
  }

  if (!result.name || !result.description) return null;
  return result as unknown as ParsedFrontmatter;
}

/**
 * Load a single skill definition from a markdown file.
 */
function loadSkillFromFile(filePath: string, plugin: string): SkillDefinition | null {
  let content: string;
  try {
    content = fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }

  const fm = parseFrontmatter(content);
  if (!fm) return null;

  const id = `/${fm.name}`;
  const category = PLUGIN_CATEGORY[plugin] || 'operations';
  const agent = PLUGIN_AGENT[plugin] || { id: 'planner', capabilities: [] };

  // Extract the body (everything after frontmatter) as the prompt template
  const endIdx = content.indexOf('---', 3);
  const body = endIdx !== -1 ? content.slice(endIdx + 3).trim() : '';

  return {
    id,
    name: fm.name,
    description: fm.description,
    category,
    agent,
    routing: {
      providerPriority: ['anthropic', 'openai', 'google'],
      fallback: true,
      taskType: category,
      complexity: body.length > 5000 ? 'high' : body.length > 1500 ? 'medium' : 'low',
    },
    input: { type: 'object', properties: { prompt: { type: 'string' } } },
    output: { type: 'object', properties: { result: { type: 'string' } } },
    promptTemplate: body,
    config: { temperature: 0, maxTokens: 4000, responseFormat: 'markdown' },
    memory: {
      storeInput: true,
      storeOutput: true,
      tags: [fm.name, plugin],
      searchable: true,
    },
    governance: {
      requiresApproval: false,
      auditLevel: 'full',
      dataClassification: 'internal',
    },
    connectors: [],
  };
}

/**
 * Load all skill definitions from docs/skills/ directory.
 * Returns an array of SkillDefinitions parsed from markdown frontmatter.
 */
export function loadSkillsFromDocs(docsRoot?: string): SkillDefinition[] {
  const root = docsRoot || path.resolve(process.cwd(), 'docs', 'skills');
  const skills: SkillDefinition[] = [];

  if (!fs.existsSync(root)) return skills;

  // Iterate over plugin directories
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;

    const pluginDir = path.join(root, entry.name);

    // Read all .md files that aren't README
    for (const file of fs.readdirSync(pluginDir)) {
      if (file === 'README.md' || !file.endsWith('.md')) continue;

      const skill = loadSkillFromFile(path.join(pluginDir, file), entry.name);
      if (skill) skills.push(skill);
    }
  }

  return skills;
}

/**
 * Register all docs-based skills into a SkillRegistry.
 * Skips skills that are already registered (code-defined skills take priority).
 */
export function registerDocsSkills(registry: SkillRegistry, docsRoot?: string): number {
  const skills = loadSkillsFromDocs(docsRoot);
  let registered = 0;

  for (const skill of skills) {
    if (!registry.has(skill.id)) {
      registry.register(skill);
      registered++;
    }
  }

  return registered;
}
