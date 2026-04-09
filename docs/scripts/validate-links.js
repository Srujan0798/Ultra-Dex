#!/usr/bin/env node

/**
 * Ultra-Dex Documentation Link Validator
 * Validates all internal links in the documentation system
 *
 * Usage: node scripts/validate-links.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

async function readMarkdownFiles(dir) {
  const files = [];
  const dirents = await fs.readdir(dir, { withFileTypes: true });

  for (const dirent of dirents) {
    const fullPath = path.join(dir, dirent.name);

    if (dirent.isDirectory()) {
      if (
        dirent.name !== 'node_modules' &&
        dirent.name !== '.git' &&
        dirent.name !== '.ultra-dex'
      ) {
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
  return (
    url.startsWith('./') || url.startsWith('../') || url.startsWith('/') || !url.startsWith('http')
  );
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
        // Handle anchor links separately (e.g., ./file.md#section)
        const [urlPath, anchor] = link.url.split('#');
        const targetPath = resolveRelativePath(filePath, urlPath);

        // Check if file exists
        await fs.access(targetPath);

        // If there's an anchor, we could optionally check if the anchor exists in the file
        // For now, we'll just validate the file exists
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

async function validateAllLinks() {
  console.log('🔍 Ultra-Dex Documentation Link Validation Started...\n');

  try {
    const markdownFiles = await readMarkdownFiles(rootDir + '/docs');
    console.log(`📋 Found ${markdownFiles.length} markdown files to validate\n`);

    let totalErrors = 0;
    let totalLinks = 0;
    let errorFiles = new Set();

    for (const file of markdownFiles) {
      const errors = await validateFileLinks(file);
      const fileLinks = extractLinks(await fs.readFile(file, 'utf8'));
      totalLinks += fileLinks.length;

      if (errors.length > 0) {
        console.log(`❌ ${path.relative(rootDir, file)}`);
        for (const error of errors) {
          console.log(`   • Link: ${error.link} - ${error.error}`);
        }
        console.log('');
        totalErrors += errors.length;
        errorFiles.add(path.dirname(file));
      }
    }

    console.log(`📊 VALIDATION SUMMARY`);
    console.log(`====================`);
    console.log(`Files Checked: ${markdownFiles.length}`);
    console.log(`Links Analyzed: ${totalLinks}`);
    console.log(`Broken Links: ${totalErrors}`);
    console.log(`Affected Directories: ${errorFiles.size}`);

    if (totalErrors === 0) {
      console.log('\n✅ All validations passed! Documentation links are in excellent condition.');
      process.exit(0);
    } else {
      console.log(`\n⚠️  Found ${totalErrors} broken link(s) in ${errorFiles.size} directories.`);
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Error during validation:', error.message);
    process.exit(1);
  }
}

// Run validation if this script is executed directly
if (process.argv[1] === __filename) {
  validateAllLinks();
}

export {
  readMarkdownFiles,
  extractLinks,
  isInternalLink,
  resolveRelativePath,
  validateFileLinks,
  validateAllLinks,
};
