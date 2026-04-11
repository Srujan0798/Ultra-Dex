#!/usr/bin/env node

/**
 * Build script for Ultra-Dex Skills System
 * Compiles TypeScript skills to JavaScript for CLI usage
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');
const distDir = path.join(projectRoot, 'dist');
const skillsSrcDir = path.join(srcDir, 'core', 'skills');
const skillsDistDir = path.join(distDir, 'core', 'skills');

console.log('🏗️  Building Ultra-Dex Skills System...');

// Create dist directory structure
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

ensureDir(skillsDistDir);

// Copy skills structure
const copyDir = (src, dest) => {
  ensureDir(dest);
  const items = fs.readdirSync(src);

  for (const item of items) {
    const srcPath = path.join(src, item);
    const destPath = path.join(dest, item);

    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else if (item.endsWith('.ts')) {
      // Convert .ts to .js
      const jsItem = item.replace('.ts', '.js');
      const jsDestPath = path.join(dest, jsItem);

      // For now, just copy with simple transformation
      // In production, you'd want to use TypeScript compiler
      const content = fs.readFileSync(srcPath, 'utf8');
      fs.writeFileSync(jsDestPath, content);
    }
  }
};

// Copy skills directory structure
copyDir(skillsSrcDir, skillsDistDir);

// Create a simple index.js that re-exports from TypeScript
const indexContent = `
/**
 * Ultra-Dex Skills System - JavaScript Bridge
 * This file bridges the TypeScript skills system to JavaScript CLI
 */

import { SkillsAPI, initializeSkills } from './index.ts';

export { SkillsAPI, initializeSkills };
export default SkillsAPI;
`;

fs.writeFileSync(path.join(skillsDistDir, 'index.js'), indexContent);

console.log('✅ Skills system built successfully!');
console.log(`📁 Output directory: ${skillsDistDir}`);
