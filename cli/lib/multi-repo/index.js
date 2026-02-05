/**
 * Multi-Repo Orchestration
 * Monorepo support, cross-repo context, shared agents, unified dashboard.
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

export async function discoverRepos(rootDir = process.cwd()) {
  const repoPaths = await glob('**/.git', {
    cwd: rootDir,
    nodir: false,
    ignore: ['**/node_modules/**', '**/.ultra-dex/**']
  });
  return repoPaths.map(repo => path.dirname(path.join(rootDir, repo)));
}

export async function buildCrossRepoContext(repos) {
  const contexts = [];
  for (const repo of repos) {
    const contextPath = path.join(repo, 'CONTEXT.md');
    try {
      const content = await fs.readFile(contextPath, 'utf8');
      contexts.push({ repo, context: content });
    } catch {
      contexts.push({ repo, context: null });
    }
  }
  return contexts;
}

export function sharedAgents() {
  return ['planner', 'frontend', 'backend', 'security', 'testing'];
}

export async function buildUnifiedDashboard(repos) {
  const contexts = await buildCrossRepoContext(repos);
  return {
    repos: repos.length,
    contextsLoaded: contexts.filter(c => c.context).length,
    agents: sharedAgents(),
    timestamp: new Date().toISOString()
  };
}

export default {
  discoverRepos,
  buildCrossRepoContext,
  sharedAgents,
  buildUnifiedDashboard
};
