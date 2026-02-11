// Copyright (c) 2026 Ultra-Dex

const tools = new Map();
const resources = new Map();

export function registerTool(definition) {
  if (!definition?.name) throw new Error('Tool definition must include name');
  tools.set(definition.name, definition);
}

export function registerResource(definition) {
  if (!definition?.name) throw new Error('Resource definition must include name');
  resources.set(definition.name, definition);
}

export function listTools() {
  return Array.from(tools.values());
}

export function listResources() {
  return Array.from(resources.values());
}

export default {
  registerTool,
  registerResource,
  listTools,
  listResources,
};
