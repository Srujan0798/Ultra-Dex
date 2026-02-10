#!/usr/bin/env node

/**
 * Ultra-Dex AgPrompts Cross-Reference Generator
 * Creates a matrix of relationships between prompts
 * 
 * Usage: node scripts/generate-cross-ref.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Regular expression to extract YAML frontmatter
const FRONTMATTER_REGEX = /^---\n([\s\S]*?)\n---\n/;

function extractFrontmatter(content) {
  const match = content.match(FRONTMATTER_REGEX);
  if (match) {
    try {
      const yamlContent = match[1];
      return yaml.load(yamlContent);
    } catch (error) {
      console.warn('⚠️  Invalid YAML frontmatter:', error.message);
      return null;
    }
  }
  return null;
}

async function readMarkdownFiles(dir) {
  const files = [];
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  
  for (const dirent of dirents) {
    const fullPath = path.join(dir, dirent.name);
    
    if (dirent.isDirectory()) {
      if (dirent.name !== 'node_modules' && dirent.name !== '.git') {
        files.push(...await readMarkdownFiles(fullPath));
      }
    } else if (path.extname(dirent.name) === '.md') {
      files.push(fullPath);
    }
  }
  
  return files;
}

function generateCrossReferenceMatrix(files) {
  const prompts = [];
  
  // Extract metadata from each file
  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf8');
      const frontmatter = extractFrontmatter(content);
      
      if (frontmatter) {
        prompts.push({
          id: frontmatter.id || path.basename(file, '.md'),
          title: frontmatter.title || 'Untitled',
          file: path.relative(rootDir, file),
          category: frontmatter.category || 'unknown',
          related: frontmatter.related || [],
          tags: frontmatter.tags || []
        });
      } else {
        // If no frontmatter, create basic entry
        prompts.push({
          id: path.basename(file, '.md'),
          title: path.basename(file, '.md'),
          file: path.relative(rootDir, file),
          category: 'legacy',
          related: [],
          tags: []
        });
      }
    } catch (error) {
      console.warn(`⚠️  Could not read file: ${file}`, error.message);
    }
  }
  
  // Create cross-reference matrix
  const matrix = [];
  
  for (const prompt of prompts) {
    const relatedPrompts = [];
    
    // Find prompts that reference this one
    for (const otherPrompt of prompts) {
      if (otherPrompt.id !== prompt.id && 
          (otherPrompt.related.includes(prompt.id) || 
           otherPrompt.tags.some(tag => prompt.tags.includes(tag)))) {
        relatedPrompts.push(otherPrompt);
      }
    }
    
    matrix.push({
      ...prompt,
      relatedTo: relatedPrompts
    });
  }
  
  return matrix;
}

function generateMarkdownReport(matrix) {
  let report = `# Ultra-Dex AgPrompts Cross-Reference Matrix

> **Generated:** ${new Date().toISOString()}
> **Total Prompts:** ${matrix.length}

---

## 📊 Overview

| Category | Count |
|----------|-------|
`;

  // Count by category
  const categories = {};
  for (const prompt of matrix) {
    categories[prompt.category] = (categories[prompt.category] || 0) + 1;
  }
  
  for (const [category, count] of Object.entries(categories)) {
    report += `| ${category} | ${count} |\n`;
  }
  
  report += `\n---

## 🗂️ Detailed Cross-References

`;
  
  for (const prompt of matrix) {
    report += `### ${prompt.id}: ${prompt.title}\n\n`;
    report += `- **File:** \`${prompt.file}\`\n`;
    report += `- **Category:** ${prompt.category}\n`;
    report += `- **Tags:** ${prompt.tags.length > 0 ? prompt.tags.join(', ') : 'None'}\n`;
    
    if (prompt.relatedTo.length > 0) {
      report += `- **Related To:**\n`;
      for (const related of prompt.relatedTo) {
        report += `  - ${related.id}: ${related.title}\n`;
      }
    } else {
      report += `- **Related To:** None\n`;
    }
    
    report += `\n---\n\n`;
  }
  
  return report;
}

async function main() {
  console.log('🔗 Ultra-Dex AgPrompts Cross-Reference Generator Started...\n');
  
  try {
    const markdownFiles = await readMarkdownFiles(rootDir);
    console.log(`📋 Found ${markdownFiles.length} markdown files\n`);
    
    const matrix = await generateCrossReferenceMatrix(markdownFiles);
    const report = generateMarkdownReport(matrix);
    
    const outputPath = path.join(rootDir, 'CROSS-REFERENCE-MATRIX.md');
    await fs.writeFile(outputPath, report);
    
    console.log(`✅ Cross-reference matrix generated successfully!`);
    console.log(`📄 Output saved to: ${outputPath}`);
    console.log(`📊 Total prompts processed: ${matrix.length}`);
    
  } catch (error) {
    console.error('💥 Error during generation:', error.message);
    process.exit(1);
  }
}

// Run generation if this script is executed directly
if (process.argv[1] === __filename) {
  main();
}

export { extractFrontmatter, generateCrossReferenceMatrix, generateMarkdownReport };