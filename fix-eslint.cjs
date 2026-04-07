#!/usr/bin/env node
/**
 * Automated ESLint fixer
 * Fixes unused variables by prefixing with _
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_DIR = '/Users/srujansai/Desktop/Ultra-Dex';

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
}

// Parse ESLint output to get errors by file
function parseLintOutput(output) {
  const errorsByFile = {};
  let currentFile = null;
  
  const lines = output.split('\n');
  for (const line of lines) {
    const fileMatch = line.match(/^(\/.*\.(js|ts))$/);
    if (fileMatch) {
      currentFile = fileMatch[1];
      if (!errorsByFile[currentFile]) {
        errorsByFile[currentFile] = [];
      }
      continue;
    }
    
    if (!currentFile) continue;
    
    const errorMatch = line.match(/^\s*(\d+):(\d+)\s+error\s+(.+)$/);
    if (errorMatch) {
      const lineNum = parseInt(errorMatch[1]);
      const colNum = parseInt(errorMatch[2]);
      const message = errorMatch[3];
      errorsByFile[currentFile].push({ lineNum, colNum, message });
    }
  }
  
  return errorsByFile;
}

// Fix a single file
function fixFile(filePath, errors) {
  let content = readFile(filePath);
  const lines = content.split('\n');
  let modified = false;
  
  // Group errors by line
  const errorsByLine = {};
  for (const error of errors) {
    if (!errorsByLine[error.lineNum]) {
      errorsByLine[error.lineNum] = [];
    }
    errorsByLine[error.lineNum].push(error);
  }
  
  // Process each line with errors
  const lineNums = Object.keys(errorsByLine).map(Number).sort((a, b) => b - a); // Process from bottom to top
  
  for (const lineNum of lineNums) {
    const lineErrors = errorsByLine[lineNum];
    const lineIndex = lineNum - 1;
    
    if (lineIndex < 0 || lineIndex >= lines.length) continue;
    
    let line = lines[lineIndex];
    
    for (const error of lineErrors) {
      const { message } = error;
      
      // Handle "is defined but never used" or "is assigned a value but never used"
      const unusedMatch = message.match(/^'([^']+)' is (?:defined|assigned a value) but never used/);
      if (unusedMatch) {
        const varName = unusedMatch[1];
        
        // Skip if already prefixed
        if (varName.startsWith('_')) continue;
        
        // Special case: don't prefix '_' itself
        if (varName === '_') continue;
        
        // For import statements - remove the import
        if (line.match(/^\s*import\s/)) {
          // Handle named imports: import { a, b } from '...'
          const namedImportMatch = line.match(/^(import\s+)\{([^}]+)\}(\s+from\s+['"].*?['"]\s*;?)$/);
          if (namedImportMatch) {
            const [, prefix, imports, suffix] = namedImportMatch;
            const importItems = imports.split(',').map(s => s.trim());
            const remaining = importItems.filter(item => {
              const nameMatch = item.match(/^(\w+)(\s+as\s+\w+)?$/);
              if (!nameMatch) return true;
              return nameMatch[1] !== varName;
            });
            
            if (remaining.length === 0) {
              lines[lineIndex] = '';
            } else {
              lines[lineIndex] = `${prefix}{ ${remaining.join(', ')} }${suffix}`;
            }
            modified = true;
            continue;
          }
          
          // Handle default import: import name from '...'
          const defaultImportMatch = line.match(/^(import\s+)(\w+)(\s+from\s+['"].*?['"]\s*;?)$/);
          if (defaultImportMatch) {
            const [, prefix, importName, suffix] = defaultImportMatch;
            if (importName === varName) {
              lines[lineIndex] = '';
              modified = true;
              continue;
            }
          }
          
          // Handle namespace import: import * as name from '...'
          const nsMatch = line.match(/^(import\s+\*\s+as\s+)(\w+)(\s+from\s+['"].*?['"]\s*;?)$/);
          if (nsMatch) {
            const [, prefix, importName, suffix] = nsMatch;
            if (importName === varName) {
              lines[lineIndex] = '';
              modified = true;
              continue;
            }
          }
          
          // Handle require: const { a, b } = require('...')
          const requireMatch = line.match(/^(const\s+)\{([^}]+)\}(\s*=\s*require\([^)]+\)\s*;?)$/);
          if (requireMatch) {
            const [, prefix, imports, suffix] = requireMatch;
            const importItems = imports.split(',').map(s => s.trim());
            const remaining = importItems.filter(item => {
              const nameMatch = item.match(/^(\w+)(\s*:\s*\w+)?$/);
              if (!nameMatch) return true;
              return nameMatch[1] !== varName;
            });
            
            if (remaining.length === 0) {
              lines[lineIndex] = '';
            } else {
              lines[lineIndex] = `${prefix}{ ${remaining.join(', ')} }${suffix}`;
            }
            modified = true;
            continue;
          }
          
          // Handle single require: const name = require('...')
          const singleRequire = line.match(/^(const\s+)(\w+)(\s*=\s*require\([^)]+\)\s*;?)$/);
          if (singleRequire) {
            const [, prefix, importName, suffix] = singleRequire;
            if (importName === varName) {
              lines[lineIndex] = '';
              modified = true;
              continue;
            }
          }
          
          continue;
        }
        
        // For catch clauses: catch (error) => catch (_error)
        if (line.match(new RegExp(`catch\\s*\\(\\s*${escapeRegex(varName)}\\s*\\)`))) {
          lines[lineIndex] = line.replace(
            new RegExp(`(catch\\s*\\(\\s*)${escapeRegex(varName)}(\\s*\\))`),
            `$1_${varName}$2`
          );
          modified = true;
          continue;
        }
        
        // For variable declarations: const/var/let name = ...
        if (line.match(new RegExp(`\\b(const|let|var)\\s+${escapeRegex(varName)}\\b`))) {
          lines[lineIndex] = line.replace(
            new RegExp(`\\b(const|let|var)\\s+${escapeRegex(varName)}\\b`),
            `$1 _${varName}`
          );
          modified = true;
          continue;
        }
        
        // For function parameters in various contexts
        // Check if this looks like a parameter position
        if (line.match(new RegExp(`\\([^)]*\\b${escapeRegex(varName)}\\b[^)]*\\)\\s*(=>|\\{)`)) ||
            line.match(new RegExp(`function\\s+\\w+\\s*\\([^)]*\\b${escapeRegex(varName)}\\b`))) {
          lines[lineIndex] = line.replace(
            new RegExp(`(?<![\\w_])${escapeRegex(varName)}(?![\\w_])`, 'g'),
            `_${varName}`
          );
          modified = true;
          continue;
        }
        
        // For callback parameters in .forEach, .map, etc.
        if (line.match(new RegExp(`\\(\\s*${escapeRegex(varName)}\\s*[,)]`))) {
          lines[lineIndex] = line.replace(
            new RegExp(`(?<![\\w_])${escapeRegex(varName)}(?![\\w_])`, 'g'),
            `_${varName}`
          );
          modified = true;
          continue;
        }
        
        // For destructuring in object patterns
        if (line.match(new RegExp(`\\{\\s*${escapeRegex(varName)}\\s*[,}]`))) {
          lines[lineIndex] = line.replace(
            new RegExp(`(\\{\\s*)${escapeRegex(varName)}(\\s*[,}])`),
            `$1_${varName}$2`
          );
          modified = true;
          continue;
        }
        
        // For arrow function parameters: (param) => or (param, ...) =>
        if (line.match(new RegExp(`\\(\\s*${escapeRegex(varName)}\\s*\\)\\s*=>`))) {
          lines[lineIndex] = line.replace(
            new RegExp(`(\\(\\s*)${escapeRegex(varName)}(\\s*\\)\\s*=>)`),
            `$1_${varName}$2`
          );
          modified = true;
          continue;
        }
        
        // Generic fallback: replace all occurrences of the variable name
        if (line.includes(varName)) {
          lines[lineIndex] = line.replace(
            new RegExp(`\\b${escapeRegex(varName)}\\b`, 'g'),
            `_${varName}`
          );
          modified = true;
        }
      }
      
      // Handle "is not defined" errors - these need manual fixing
      // Handle "Unreachable code" - needs manual fixing
      // Handle "no-case-declarations" - needs wrapping in braces
    }
  }
  
  if (modified) {
    writeFile(filePath, lines.join('\n'));
    return true;
  }
  return false;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Main
async function main() {
  console.log('Running ESLint...');
  
  let lintOutput;
  try {
    lintOutput = execSync('npm run lint 2>&1', { 
      cwd: PROJECT_DIR,
      maxBuffer: 50 * 1024 * 1024,
      encoding: 'utf8'
    });
  } catch (error) {
    lintOutput = error.stdout || error.message;
  }
  
  const errorsByFile = parseLintOutput(lintOutput);
  console.log(`Found errors in ${Object.keys(errorsByFile).length} files`);
  
  let fixedCount = 0;
  for (const [filePath, errors] of Object.entries(errorsByFile)) {
    if (!fs.existsSync(filePath)) continue;
    
    try {
      const fixed = fixFile(filePath, errors);
      if (fixed) {
        fixedCount++;
        console.log(`Fixed: ${filePath}`);
      }
    } catch (error) {
      console.error(`Error fixing ${filePath}: ${error.message}`);
    }
  }
  
  console.log(`\nFixed ${fixedCount} files`);
}

main();
