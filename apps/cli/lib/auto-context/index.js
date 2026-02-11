// Copyright (c) 2026 Ultra-Dex

/**
 * Auto Context Engine
 * Scans project, builds knowledge graph, infers conventions, and writes CONTEXT.md.
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { projectGraph } from '../mcp/graph.js';

const DEFAULT_CONTEXT_PATH = 'CONTEXT.md';
const MAX_SAMPLE_FILES = 40;

const STACK_RULES = [
  { id: 'nextjs', match: ['next', '@next/'] },
  { id: 'remix', match: ['@remix-run', 'remix'] },
  { id: 'sveltekit', match: ['@sveltejs/kit', 'svelte'] },
  { id: 'react', match: ['react', 'react-dom'] },
  { id: 'vue', match: ['vue', 'nuxt'] },
  { id: 'express', match: ['express'] },
  { id: 'fastify', match: ['fastify'] },
  { id: 'prisma', match: ['prisma', '@prisma/client'] },
  { id: 'supabase', match: ['@supabase', 'supabase'] },
  { id: 'stripe', match: ['stripe'] },
  { id: 'typescript', match: ['typescript'] },
];

const AGENT_RECOMMENDATIONS = {
  nextjs: ['frontend', 'backend', 'auth'],
  remix: ['frontend', 'backend'],
  sveltekit: ['frontend', 'backend'],
  react: ['frontend'],
  vue: ['frontend'],
  express: ['backend'],
  fastify: ['backend'],
  prisma: ['database'],
  supabase: ['database', 'backend'],
  stripe: ['backend', 'security'],
  typescript: ['refactoring', 'testing'],
};

async function safeReadJson(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

function detectStack(dependencies = {}) {
  const depKeys = Object.keys(dependencies || {});
  const detected = [];

  for (const rule of STACK_RULES) {
    const matched = rule.match.some((token) => depKeys.some((dep) => dep.includes(token)));
    if (matched) detected.push(rule.id);
  }

  return detected;
}

async function inferConventions(files, rootDir) {
  let spaceIndents = 0;
  let tabIndents = 0;
  const indentSizes = {};
  let crlf = 0;
  let lf = 0;
  let kebab = 0;
  let snake = 0;

  const sample = files.slice(0, MAX_SAMPLE_FILES);

  for (const file of sample) {
    const fullPath = path.join(rootDir, file);
    let content = '';
    try {
      content = await fs.readFile(fullPath, 'utf8');
    } catch {
      continue;
    }

    if (content.includes('\r\n')) crlf += 1;
    else lf += 1;

    const lines = content.split(/\r?\n/).slice(0, 200);
    for (const line of lines) {
      const match = line.match(/^(\t+| +)/);
      if (match) {
        if (match[0].includes('\t')) {
          tabIndents += 1;
        } else {
          spaceIndents += 1;
          const size = match[0].length;
          indentSizes[size] = (indentSizes[size] || 0) + 1;
        }
      }
    }
  }

  files.forEach((file) => {
    if (file.includes('-')) kebab += 1;
    if (file.includes('_')) snake += 1;
  });

  const indentStyle = tabIndents > spaceIndents ? 'tabs' : 'spaces';
  const indentSize = Object.entries(indentSizes).sort((a, b) => b[1] - a[1])[0]?.[0] || 2;
  const lineEndings = crlf > lf ? 'CRLF' : 'LF';
  const naming = kebab >= snake ? 'kebab-case' : 'snake_case';

  return { indentStyle, indentSize: Number(indentSize), lineEndings, naming };
}

function suggestAgents(stack = []) {
  const recommendations = new Set();
  stack.forEach((item) => {
    const agents = AGENT_RECOMMENDATIONS[item] || [];
    agents.forEach((agent) => recommendations.add(agent));
  });
  if (recommendations.size === 0) {
    recommendations.add('planner');
    recommendations.add('frontend');
    recommendations.add('backend');
  }
  return Array.from(recommendations);
}

function formatContext({ projectName, stack, conventions, graphSummary, agents, fileStats }) {
  return (
    `# Project Context\n\n` +
    `## Snapshot\n` +
    `- Project: ${projectName || 'Unknown'}\n` +
    `- Stack: ${stack.length ? stack.join(', ') : 'Unidentified'}\n` +
    `- Generated: ${new Date().toISOString()}\n\n` +
    `## Conventions\n` +
    `- Indentation: ${conventions.indentStyle} (${conventions.indentSize})\n` +
    `- Line Endings: ${conventions.lineEndings}\n` +
    `- File Naming: ${conventions.naming}\n\n` +
    `## Knowledge Graph\n` +
    `- Files Indexed: ${graphSummary?.nodeCount ?? 'n/a'}\n` +
    `- Dependencies: ${graphSummary?.edgeCount ?? 'n/a'}\n\n` +
    `## File Breakdown\n` +
    `${Object.entries(fileStats)
      .map(([ext, count]) => `- ${ext || 'no-ext'}: ${count}`)
      .join('\n')}\n\n` +
    `## Suggested Agents\n` +
    `${agents.map((agent) => `- @${agent}`).join('\n')}\n`
  );
}

async function buildFileStats(files) {
  const stats = {};
  files.forEach((file) => {
    const ext = path.extname(file) || 'no-ext';
    stats[ext] = (stats[ext] || 0) + 1;
  });
  return stats;
}

export async function scanProject(rootDir = process.cwd()) {
  const files = await glob('**/*.*', {
    cwd: rootDir,
    nodir: true,
    ignore: [
      '**/node_modules/**',
      '**/.git/**',
      '**/.ultra-dex/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
    ],
  });

  const packageJson = await safeReadJson(path.join(rootDir, 'package.json'));
  const dependencies = {
    ...(packageJson?.dependencies || {}),
    ...(packageJson?.devDependencies || {}),
  };

  const stack = detectStack(dependencies);
  const conventions = await inferConventions(files, rootDir);
  const fileStats = await buildFileStats(files);

  return { files, stack, conventions, fileStats, packageJson };
}

export async function buildKnowledgeGraph(rootDir = process.cwd()) {
  try {
    await projectGraph.scan(rootDir);
    return projectGraph.getSummary();
  } catch {
    return null;
  }
}

export async function generateContext({
  rootDir = process.cwd(),
  outputPath = DEFAULT_CONTEXT_PATH,
} = {}) {
  const scan = await scanProject(rootDir);
  const graphSummary = await buildKnowledgeGraph(rootDir);
  const agents = suggestAgents(scan.stack);

  const projectName = scan.packageJson?.name || path.basename(rootDir);
  const context = formatContext({
    projectName,
    stack: scan.stack,
    conventions: scan.conventions,
    graphSummary: graphSummary
      ? { nodeCount: graphSummary.nodeCount, edgeCount: graphSummary.edgeCount }
      : null,
    agents,
    fileStats: scan.fileStats,
  });

  await fs.writeFile(path.join(rootDir, outputPath), context, 'utf8');

  return {
    contextPath: path.join(rootDir, outputPath),
    stack: scan.stack,
    conventions: scan.conventions,
    agents,
    graphSummary,
  };
}

export async function runAutoContext(rootDir = process.cwd()) {
  return generateContext({ rootDir });
}

export default {
  scanProject,
  buildKnowledgeGraph,
  generateContext,
  runAutoContext,
};
