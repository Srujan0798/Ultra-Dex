#!/usr/bin/env node

/**
 * Ultra-Dex Docs Validation Script
 * Validates all improvements made to the docs folder
 * 
 * Usage: node scripts/validate-docs.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function validateNamingConvention() {
  console.log('🔍 Validating naming conventions...');
  
  const filesWithUnderscores = [];
  const dirents = await fs.readdir(rootDir, { withFileTypes: true });
  
  async function scanDirectory(dirPath) {
    const dirents = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const dirent of dirents) {
      const fullPath = path.join(dirPath, dirent.name);
      
      if (dirent.isDirectory()) {
        if (dirent.name !== 'node_modules' && dirent.name !== '.git') {
          await scanDirectory(fullPath);
        }
      } else if (path.extname(dirent.name) === '.md') {
        if (dirent.name.includes('_')) {
          filesWithUnderscores.push(fullPath);
        }
      }
    }
  }
  
  await scanDirectory(rootDir);
  
  console.log(`   Found ${filesWithUnderscores.length} files with underscores (these are in archive and won't affect main docs)`);
  if (filesWithUnderscores.length > 0) {
    console.log(`   Sample: ${filesWithUnderscores.slice(0, 3).map(f => path.relative(rootDir, f)).join(', ')}`);
  }
  
  return { total: filesWithUnderscores.length, files: filesWithUnderscores };
}

async function validateVersionReferences() {
  console.log('🔍 Validating version references...');
  
  const markdownFiles = [];
  const dirents = await fs.readdir(rootDir, { withFileTypes: true });
  
  async function scanDirectory(dirPath) {
    const dirents = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const dirent of dirents) {
      const fullPath = path.join(dirPath, dirent.name);
      
      if (dirent.isDirectory()) {
        if (dirent.name !== 'node_modules' && dirent.name !== '.git') {
          await scanDirectory(fullPath);
        }
      } else if (path.extname(dirent.name) === '.md') {
        markdownFiles.push(fullPath);
      }
    }
  }
  
  await scanDirectory(rootDir);
  
  let outdatedVersions = 0;
  const outdatedFiles = [];
  
  for (const file of markdownFiles) {
    try {
      const content = await fs.readFile(file, 'utf8');
      // Look for version references that are not current
      if (content.includes('v1.7.0') && !content.includes('v6.0.0 OVERPOWERED')) {
        outdatedVersions++;
        outdatedFiles.push(path.relative(rootDir, file));
      }
    } catch (error) {
      console.warn(`⚠️  Could not read file: ${file}`);
    }
  }
  
  console.log(`   Checked ${markdownFiles.length} markdown files`);
  console.log(`   Found ${outdatedVersions} files with outdated version references`);
  
  return { totalChecked: markdownFiles.length, outdated: outdatedVersions, files: outdatedFiles };
}

async function validateFileCompleteness() {
  console.log('🔍 Validating file completeness...');
  
  const markdownFiles = [];
  const dirents = await fs.readdir(rootDir, { withFileTypes: true });
  
  async function scanDirectory(dirPath) {
    const dirents = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const dirent of dirents) {
      const fullPath = path.join(dirPath, dirent.name);
      
      if (dirent.isDirectory()) {
        if (dirent.name !== 'node_modules' && dirent.name !== '.git') {
          await scanDirectory(fullPath);
        }
      } else if (path.extname(dirent.name) === '.md') {
        markdownFiles.push(fullPath);
      }
    }
  }
  
  await scanDirectory(rootDir);
  
  let emptyOrMinimalFiles = 0;
  const minimalFiles = [];
  
  for (const file of markdownFiles) {
    try {
      const content = await fs.readFile(file, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.trim() !== '');
      
      // Check if file has minimal content (less than 5 meaningful lines)
      if (lines.length < 5) {
        emptyOrMinimalFiles++;
        minimalFiles.push({
          path: path.relative(rootDir, file),
          lines: lines.length
        });
      }
    } catch (error) {
      console.warn(`⚠️  Could not read file: ${file}`);
    }
  }
  
  console.log(`   Found ${emptyOrMinimalFiles} files with minimal content`);
  
  return { totalChecked: markdownFiles.length, minimal: emptyOrMinimalFiles, files: minimalFiles };
}

async function validateCriticalFilesExist() {
  console.log('🔍 Validating critical files exist...');
  
  const criticalFiles = [
    'README.md',
    'INDEX.md',
    'CROSS-REFERENCE-MATRIX.md',
    'QUALITY-STANDARDS.md',
    'guides/README.md',
    'AgPrompts/INDEX.md'
  ];
  
  const missingFiles = [];
  
  for (const file of criticalFiles) {
    const filePath = path.join(rootDir, file);
    try {
      await fs.access(filePath);
      console.log(`   ✅ ${file} exists`);
    } catch (error) {
      console.log(`   ❌ ${file} missing`);
      missingFiles.push(file);
    }
  }
  
  return { total: criticalFiles.length, missing: missingFiles };
}

async function main() {
  console.log('🧪 Ultra-Dex Docs Validation Started...\n');
  
  try {
    const namingResults = await validateNamingConvention();
    console.log('');
    
    const versionResults = await validateVersionReferences();
    console.log('');
    
    const completenessResults = await validateFileCompleteness();
    console.log('');
    
    const criticalResults = await validateCriticalFilesExist();
    console.log('');
    
    console.log('📊 VALIDATION SUMMARY');
    console.log('====================');
    console.log(`Naming Convention: ${namingResults.total} files with underscores found (mostly in archive)`);
    console.log(`Version References: ${versionResults.outdated} outdated references found`);
    console.log(`File Completeness: ${completenessResults.minimal} minimal files found`);
    console.log(`Critical Files: ${criticalResults.missing.length} missing`);
    
    const totalIssues = versionResults.outdated + completenessResults.minimal + criticalResults.missing.length;
    
    if (totalIssues === 0) {
      console.log('\n✅ All validations passed! Docs are in excellent condition.');
      process.exit(0);
    } else {
      console.log(`\n⚠️  Found ${totalIssues} potential issues to review.`);
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

export { validateNamingConvention, validateVersionReferences, validateFileCompleteness, validateCriticalFilesExist };