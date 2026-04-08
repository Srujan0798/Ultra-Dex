#!/usr/bin/env node

/**
 * Ultra-Dex Project Link & Dependency Validator
 * Validates all links, references, imports, and dependencies across the entire project
 * 
 * Usage: node scripts/validate-project-links.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Track validation results
let totalFiles = 0;
let totalLinks = 0;
let brokenLinks = 0;
let missingImports = 0;
let invalidReferences = 0;
let validationErrors = [];

async function readProjectFiles(dir) {
  const files = [];
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  
  for (const dirent of dirents) {
    const fullPath = path.join(dir, dirent.name);
    
    if (dirent.isDirectory()) {
      if (dirent.name !== 'node_modules' && dirent.name !== '.git' && !dirent.name.startsWith('.')) {
        files.push(...await readProjectFiles(fullPath));
      }
    } else if (path.extname(dirent.name) === '.js' || path.extname(dirent.name) === '.ts' || path.extname(dirent.name) === '.md') {
      files.push(fullPath);
    }
  }
  
  return files;
}

function extractMarkdownLinks(content) {
  // Match markdown links: [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links = [];
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    links.push({
      text: match[1],
      url: match[2],
      position: match.index
    });
  }

  return links;
}

function extractImportStatements(content) {
  // Match JavaScript/TypeScript import statements
  const importRegex = /import\s+[\s\S]*?from\s+['"`]([^'"`]+)['"`]|import\s+['"`]([^'"`]+)['"`]/g;
  const imports = [];
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1] || match[2];
    imports.push({
      path: importPath,
      position: match.index
    });
  }
  
  return imports;
}

function extractRequireStatements(content) {
  // Match JavaScript require statements
  const requireRegex = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
  const requires = [];
  let match;
  
  while ((match = requireRegex.exec(content)) !== null) {
    requires.push({
      path: match[1],
      position: match.index
    });
  }
  
  return requires;
}

function isInternalLink(url) {
  return url.startsWith('./') || url.startsWith('../') || url.startsWith('/');
}

function isExternalLink(url) {
  return url.startsWith('http://') || url.startsWith('https://');
}

function resolveRelativePath(basePath, linkUrl) {
  const baseDir = path.dirname(basePath);
  return path.resolve(baseDir, linkUrl);
}

async function validateMarkdownLink(basePath, linkUrl) {
  if (isExternalLink(linkUrl)) {
    // For external links, we'll just check if they're well-formed
    try {
      new URL(linkUrl);
      return { valid: true, error: null };
    } catch (error) {
      return { valid: false, error: `Invalid external URL: ${error.message}` };
    }
  } else if (isInternalLink(linkUrl)) {
    // Handle anchor links separately (e.g., ./file.md#section)
    const [urlPath, anchor] = linkUrl.split('#');
    const targetPath = resolveRelativePath(basePath, urlPath);
    
    try {
      await fs.access(targetPath);
      
      // If there's an anchor, we could optionally check if the anchor exists in the file
      if (anchor) {
        const content = await fs.readFile(targetPath, 'utf8');
        // Simple check for anchor presence in markdown
        if (!content.includes(anchor) && !content.includes(`#${anchor}`) && !content.includes(`id="${anchor}"`) && !content.includes(`name="${anchor}"`)) {
          return { valid: false, error: `Anchor '#${anchor}' not found in file: ${targetPath}` };
        }
      }
      
      return { valid: true, error: null };
    } catch (error) {
      return { valid: false, error: `File not found: ${targetPath}` };
    }
  } else {
    // Relative path without explicit ./ or ../
    const targetPath = resolveRelativePath(basePath, linkUrl);
    
    try {
      await fs.access(targetPath);
      return { valid: true, error: null };
    } catch (error) {
      return { valid: false, error: `File not found: ${targetPath}` };
    }
  }
}

async function validateImportStatement(basePath, importPath) {
  // Resolve the import path relative to the base file
  let targetPath;
  
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    targetPath = path.resolve(path.dirname(basePath), importPath);
  } else if (importPath.startsWith('/')) {
    targetPath = path.resolve(rootDir, importPath.substring(1));
  } else {
    // For node_modules imports, we'll just check if they're well-formed
    return { valid: true, error: null };
  }
  
  // Check if the file exists
  try {
    await fs.access(targetPath);
    return { valid: true, error: null };
  } catch (error) {
    return { valid: false, error: `Import file not found: ${targetPath}` };
  }
}

async function validateFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    
    let fileBrokenLinks = 0;
    let fileMissingImports = 0;
    
    if (path.extname(filePath) === '.md') {
      // Validate markdown links
      const links = extractMarkdownLinks(content);
      totalLinks += links.length;

      for (const link of links) {
        const result = await validateMarkdownLink(filePath, link.url);

        if (!result.valid) {
          brokenLinks++;
          fileBrokenLinks++;
          validationErrors.push({
            file: filePath,
            type: 'broken-link',
            link: link.url,
            text: link.text,
            error: result.error,
            position: link.position
          });
        }
      }
    } else if (path.extname(filePath) === '.js' || path.extname(filePath) === '.ts') {
      // Validate import statements
      const imports = extractImportStatements(content);
      const requires = extractRequireStatements(content);

      totalLinks += imports.length + requires.length;

      for (const imp of imports) {
        const result = await validateImportStatement(filePath, imp.path);

        if (!result.valid) {
          missingImports++;
          fileMissingImports++;
          validationErrors.push({
            file: filePath,
            type: 'missing-import',
            import: imp.path,
            error: result.error,
            position: imp.position
          });
        }
      }

      for (const req of requires) {
        const result = await validateImportStatement(filePath, req.path);

        if (!result.valid) {
          missingImports++;
          fileMissingImports++;
          validationErrors.push({
            file: filePath,
            type: 'missing-require',
            require: req.path,
            error: result.error,
            position: req.position
          });
        }
      }
    }
    
    totalFiles++;
    
    if (fileBrokenLinks > 0 || fileMissingImports > 0) {
      console.log(`❌ ${path.relative(rootDir, filePath)} (${fileBrokenLinks} broken links, ${fileMissingImports} missing imports)`);
    } else {
      console.log(`✅ ${path.relative(rootDir, filePath)}`);
    }
  } catch (error) {
    validationErrors.push({
      file: filePath,
      type: 'read-error',
      error: `Could not read file: ${error.message}`
    });
    console.log(`⚠️  ${path.relative(rootDir, filePath)} (read error)`);
  }
}

async function validateProjectLinks() {
  console.log('🔍 Ultra-Dex Project Link & Dependency Validation Started...\n');
  
  try {
    const projectFiles = await readProjectFiles(rootDir);
    console.log(`📋 Found ${projectFiles.length} project files to validate\n`);
    
    // Process files sequentially to ensure proper analysis
    for (const file of projectFiles) {
      await validateFile(file);
    }
    
    console.log('\n📊 VALIDATION SUMMARY');
    console.log('====================');
    console.log(`Total Files Analyzed: ${totalFiles}`);
    console.log(`Total Links/Imports Checked: ${totalLinks}`);
    console.log(`Broken Links: ${brokenLinks}`);
    console.log(`Missing Imports: ${missingImports}`);
    console.log(`Invalid References: ${invalidReferences}`);
    console.log(`Total Errors: ${validationErrors.length}`);
    
    if (brokenLinks === 0 && missingImports === 0 && invalidReferences === 0) {
      console.log('\n✅ All validations passed! Project links and dependencies are in excellent condition.');
      process.exit(0);
    } else {
      console.log(`\n⚠️  Found ${brokenLinks + missingImports + invalidReferences} issues to review.`);
      
      // Show first 10 errors as examples
      if (validationErrors.length > 0) {
        console.log('\n📋 Sample Issues:');
        for (let i = 0; i < Math.min(10, validationErrors.length); i++) {
          const error = validationErrors[i];
          console.log(`  • ${error.type}: ${error.file} - ${error.error}`);
        }
      }
      
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Error during validation:', error.message);
    process.exit(1);
  }
}

// Run validation if this script is executed directly
if (process.argv[1] === __filename) {
  validateProjectLinks();
}

export { readProjectFiles, extractMarkdownLinks, extractImportStatements, extractRequireStatements, validateMarkdownLink, validateImportStatement, validateFile, validateProjectLinks };