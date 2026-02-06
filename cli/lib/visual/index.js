// Copyright (c) 2026 Ultra-Dex

/**
 * Visual Programming Mode
 * Drag-drop flow nodes and export to code.
 */

const DEFAULT_NODES = [
  { id: 'start', type: 'start', label: 'Start' },
  { id: 'logic', type: 'logic', label: 'Logic Block' },
  { id: 'ui', type: 'ui', label: 'UI Component' },
  { id: 'end', type: 'end', label: 'End' },
];

export function createFlow(nodes = DEFAULT_NODES, edges = []) {
  return { nodes, edges };
}

export function flowToCode(flow) {
  const lines = ['// Generated from visual flow'];
  flow.nodes.forEach((node) => {
    lines.push(`// ${node.type}: ${node.label}`);
  });
  lines.push('export function runFlow() {');
  lines.push('  return "Flow executed";');
  lines.push('}');
  return lines.join('\n');
}

export function addNode(flow, node) {
  return { ...flow, nodes: [...flow.nodes, node] };
}

export default {
  createFlow,
  flowToCode,
  addNode,
};
