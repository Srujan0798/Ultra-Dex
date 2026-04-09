#!/usr/bin/env node

/**
 * Ultra-Dex AgPrompts Link Validator
 * Validates all internal links in the AgPrompts folder
 *
 * Usage: node scripts/validate-links.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function readMarkdownFiles(dir) {
  const files = [];
  const dirents = await fs.readdir(dir, { withFileTypes: true });

  for (const dirent of dirents) {
    const fullPath = path.join(dir, dirent.name);

    if (dirent.isDirectory()) {
      if (dirent.name !== 'node_modules' && dirent.name !== '.git') {
        files.push(...(await readMarkdownFiles(fullPath)));
      }
    } else if (path.extname(dirent.name) === '.md') {
      files.push(fullPath);
    }
  }

  return files;
}

function extractLinks(content) {
  // Match markdown links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links = [];
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    links.push({
      text: match[1],
      url: match[2],
      position: match.index,
    });
  }

  return links;
}

function isInternalLink(url) {
  return url.startsWith('./') || url.startsWith('../') || !url.startsWith('http');
}

function resolveRelativePath(basePath, linkUrl) {
  const baseDir = path.dirname(basePath);
  return path.resolve(baseDir, linkUrl);
}

async function validateFileLinks(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const links = extractLinks(content);
  const errors = [];

  for (const link of links) {
    if (isInternalLink(link.url)) {
      try {
        const targetPath = resolveRelativePath(filePath, link.url);
        await fs.access(targetPath);
      } catch (error) {
        errors.push({
          file: filePath,
          link: link.url,
          text: link.text,
          error: error.message,
        });
      }
    }
  }

  return errors;
}

async function main() {
  console.log('🔍 Ultra-Dex AgPrompts Link Validation Started...\n');

  try {
    const markdownFiles = await readMarkdownFiles(rootDir);
    console.log(`📋 Found ${markdownFiles.length} markdown files to validate\n`);

    let totalErrors = 0;
    let totalLinks = 0;

    for (const file of markdownFiles) {
      const errors = await validateFileLinks(file);
      totalLinks += extractLinks(await fs.readFile(file, 'utf8')).length;

      if (errors.length > 0) {
        console.log(`❌ ${path.relative(rootDir, file)}`);
        for (const error of errors) {
          console.log(`   • Link: ${error.link} - ${error.error}`);
        }
        console.log('');
        totalErrors += errors.length;
      }
    }

    console.log(`📊 Validation Summary:`);
    console.log(`   Total Files: ${markdownFiles.length}`);
    console.log(`   Total Links: ${totalLinks}`);
    console.log(`   Broken Links: ${totalErrors}`);

    if (totalErrors === 0) {
      console.log(`\n✅ All internal links are valid!`);
      process.exit(0);
    } else {
      console.log(`\n❌ Found ${totalErrors} broken link(s)`);
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Error during validation:', error.message);
    process.exit(1);
  }
}

// Run validation if this script is executed directly
if (process.argv[1] === __filename) {
  main();
}

export { readMarkdownFiles, extractLinks, isInternalLink, resolveRelativePath, validateFileLinks };
