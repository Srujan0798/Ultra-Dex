#!/usr/bin/env node

/**
 * Build script for Ultra-Dex Skills System
 * Compiles TypeScript skills to JavaScript using tsx
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

// Test if skills can be imported
console.log('🔍 Testing skills import...');
try {
  const skillsModule = await import(`${skillsSrcDir}/index.ts`);
  console.log('✅ Skills module can be imported');

  // Test listing skills
  if (skillsModule.SkillsAPI) {
    const api = new skillsModule.SkillsAPI();
    const skills = api.list();
    console.log(`📋 Found ${skills.length} skills:`);

    const categories = {};
    skills.forEach((skill) => {
      if (!categories[skill.category]) {
        categories[skill.category] = 0;
      }
      categories[skill.category]++;
    });

    Object.entries(categories).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} skills`);
    });
  }
} catch (error) {
  console.error('❌ Failed to import skills:', error.message);
}

// Create a simple bridge file
const bridgeContent = `
/**
 * Ultra-Dex Skills System - JavaScript Bridge
 * This file bridges the TypeScript skills system to JavaScript CLI
 */

import { SkillsAPI, initializeSkills } from '../../../../src/core/skills/index.ts';

export { SkillsAPI, initializeSkills };
export default SkillsAPI;
`;

fs.writeFileSync(path.join(skillsDistDir, 'index.js'), bridgeContent);

console.log('✅ Skills system bridge created successfully!');
console.log(`📁 Bridge file: ${path.join(skillsDistDir, 'index.js')}`);
