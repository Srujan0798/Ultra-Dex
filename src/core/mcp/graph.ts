var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i]))
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { singleton } from 'tsyringe';
import fs from 'fs/promises';
import path from 'path';
import { logger } from '../../utils/logging.js';
let ProjectGraph = class {
  nodes;
  edges;
  constructor() {
    this.nodes = /* @__PURE__ */ new Map();
    this.edges = [];
  }
  async scan() {
    const root = process.cwd();
    try {
      const files = await this.walk(root);
      files.forEach((f) => this.nodes.set(f, { type: 'file' }));
    } catch (error) {
      logger.warn('Graph scan failed:', error.message);
    }
  }
  async walk(dir) {
    let results = [];
    const list = await fs.readdir(dir);
    for (const file of list) {
      if (file.startsWith('.') || file === 'node_modules') continue;
      const filepath = path.join(dir, file);
      const stat = await fs.stat(filepath);
      if (stat && stat.isDirectory()) {
        results = results.concat(await this.walk(filepath));
      } else {
        results.push(filepath);
      }
    }
    return results;
  }
  getSummary() {
    return {
      nodeCount: this.nodes.size,
      edgeCount: this.edges.length,
      files: Array.from(this.nodes.keys()),
    };
  }
};
ProjectGraph = __decorateClass([singleton()], ProjectGraph);
const projectGraph = new ProjectGraph();
export { ProjectGraph, projectGraph };
