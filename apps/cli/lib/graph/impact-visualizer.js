// Copyright (c) 2026 Ultra-Dex

/**
 * Impact Visualizer
 * Converts impact analysis to graph data and HTML reports.
 */

import fs from 'fs/promises';
import path from 'path';
import { AppError } from '../utils/errors.js';

export function buildImpactGraph(analysis, target) {
  const nodes = [];
  const links = [];

  const rootId = 'root';
  nodes.push({
    id: rootId,
    label: target,
    type: 'root',
    risk: analysis.riskLevel || 'low',
  });

  (analysis.impactedFiles || []).forEach((file, index) => {
    const nodeId = `n${index}`;
    nodes.push({
      id: nodeId,
      label: file.path,
      type: 'dependent',
      distance: file.distance,
    });
    links.push({
      source: rootId,
      target: nodeId,
      distance: file.distance,
    });
  });

  return { nodes, links, riskLevel: analysis.riskLevel, impactedCount: analysis.impactedCount };
}

export function renderImpactHtml(graph) {
  const nodesJson = JSON.stringify(graph.nodes);
  const linksJson = JSON.stringify(graph.links);

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Ultra-Dex Impact Report</title>
  <style>
    body { background: #0f172a; color: #e2e8f0; font-family: Arial, sans-serif; padding: 24px; }
    h1 { color: #38bdf8; }
    svg { background: #111827; border: 1px solid #334155; border-radius: 8px; }
    .node { fill: #38bdf8; }
    .node.dependent { fill: #f97316; }
    .link { stroke: #64748b; stroke-width: 1.5; }
  </style>
</head>
<body>
  <h1>Impact Report</h1>
  <p>Risk: ${graph.riskLevel || 'unknown'} | Impacted: ${graph.impactedCount || 0}</p>
  <svg id="graph" width="900" height="600"></svg>
  <script>
    const nodes = ${nodesJson};
    const links = ${linksJson};

    const svg = document.getElementById('graph');
    const width = svg.viewBox.baseVal.width || svg.getAttribute('width');
    const height = svg.viewBox.baseVal.height || svg.getAttribute('height');

    const centerX = width / 2;
    const centerY = height / 2;

    const angleStep = (Math.PI * 2) / Math.max(1, nodes.length - 1);
    const radius = Math.min(width, height) / 2 - 60;

    const positions = {};
    nodes.forEach((node, idx) => {
      if (node.type === 'root') {
        positions[node.id] = { x: centerX, y: centerY };
      } else {
        const angle = angleStep * (idx - 1);
        positions[node.id] = {
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius
        };
      }
    });

    links.forEach(link => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', positions[link.source].x);
      line.setAttribute('y1', positions[link.source].y);
      line.setAttribute('x2', positions[link.target].x);
      line.setAttribute('y2', positions[link.target].y);
      line.setAttribute('class', 'link');
      svg.appendChild(line);
    });

    nodes.forEach(node => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', positions[node.id].x);
      circle.setAttribute('cy', positions[node.id].y);
      circle.setAttribute('r', node.type === 'root' ? 18 : 12);
      circle.setAttribute('class', node.type === 'root' ? 'node' : 'node dependent');
      svg.appendChild(circle);

      const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      label.setAttribute('x', positions[node.id].x + 16);
      label.setAttribute('y', positions[node.id].y + 4);
      label.setAttribute('fill', '#e2e8f0');
      label.setAttribute('font-size', '12');
      label.textContent = node.label.length > 40 ? node.label.slice(0, 40) + '…' : node.label;
      svg.appendChild(label);
    });
  </script>
</body>
</html>`;
}

export async function writeImpactReport(outputPath, graph) {
  const resolvedPath = path.resolve(process.cwd(), outputPath);
  const cwd = process.cwd();
  if (!resolvedPath.startsWith(cwd)) {
    throw new AppError('Invalid output path. Path traversal detected.', {
      code: 'REPORT_PATH_INVALID',
    });
  }

  const extension = path.extname(resolvedPath).toLowerCase();
  const content = extension === '.json' ? JSON.stringify(graph, null, 2) : renderImpactHtml(graph);

  await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
  await fs.writeFile(resolvedPath, content, 'utf8');

  return { path: resolvedPath, format: extension === '.json' ? 'json' : 'html' };
}

export class ImpactVisualizer {
  constructor(graph) {
    this.graph = graph;
  }

  async generateImpactGraph(changedFiles) {
    const nodes = new Set();
    const edges = [];

    for (const file of changedFiles) {
      nodes.add(file);
      const dependents = await this.graph.getDependents(file);

      for (const dep of dependents) {
        nodes.add(dep.path);
        edges.push({
          source: file,
          target: dep.path,
          type: dep.type,
          risk: this.calculateRisk(dep),
        });
      }
    }

    return { nodes: Array.from(nodes), edges };
  }

  calculateRisk(dependency) {
    const factors = {
      isCore: dependency.path.includes('/lib/') ? 0.3 : 0,
      isTest: dependency.path.includes('/test/') ? -0.2 : 0,
      depth: Math.min((dependency.depth || 0) / 5, 0.3),
      coupling: Math.min((dependency.coupling || 0) / 10, 0.4),
    };
    return Object.values(factors).reduce((a, b) => a + b, 0);
  }

  generateD3Visualization(impactData) {
    return `<!DOCTYPE html>
<html>
<head>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    .node { fill: #69b3a2; stroke: #333; stroke-width: 1.5px; }
    .node.high-risk { fill: #e74c3c; }
    .node.medium-risk { fill: #f39c12; }
    .link { stroke: #999; stroke-opacity: 0.6; }
    .link.high-risk { stroke: #e74c3c; stroke-width: 2px; }
  </style>
</head>
<body>
  <svg width="960" height="600"></svg>
  <script>
    const data = ${JSON.stringify(impactData)};
    // D3 force simulation code...
  </script>
</body>
</html>`;
  }

  async saveVisualization(changedFiles, outputPath) {
    const impact = await this.generateImpactGraph(changedFiles);
    const html = this.generateD3Visualization(impact);
    const resolvedPath = path.resolve(process.cwd(), outputPath);
    await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
    await fs.writeFile(resolvedPath, html, 'utf8');
    return resolvedPath;
  }
}

export default ImpactVisualizer;

/**
 * Safe execution wrapper with error handling for impact-visualizer
 * @param {Function} fn - Async function to execute
 * @param {string} [context='impact-visualizer'] - Error context
 * @returns {Promise<*>} Result or null on error
 */
async function safeExecute(fn, context = 'impact-visualizer') {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
    return null;
  }
}
