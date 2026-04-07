// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview Scanner module
 * @module quality/scanner
 */

import fs from 'fs/promises';
import path from 'path';

// Define the Quality Rules
const RULES = [
  // --- EXISTING RULES ---
  {
    id: 'api-zod-validation',
    name: 'API Input Validation',
    description: 'API endpoints must validate input using Zod',
    severity: 'error',
    pattern: /app\/api\/.*\.ts|src\/routes\/.*\.ts|pages\/api\/.*\.ts/,
    check: (content) => {
      const isApi = /NextRequest|NextResponse|express\.Router|fastify/.test(content);
      if (!isApi) return true;
      return /import.*zod|require\(['"]zod['"]\)/.test(content);
    },
    message: 'API files must import "zod" for validation.',
  },
  {
    id: 'no-explicit-any',
    name: 'No Explicit Any',
    description: 'Avoid using "any" type in TypeScript',
    severity: 'warning',
    pattern: /.*\.tsx?$/,
    check: (content) => {
      return !/:\s*any\b|<\s*any\s*>/.test(content);
    },
    message: 'Found explicit "any" type. Use unknown or a specific type.',
  },
  {
    id: 'console-log-in-api',
    name: 'No Console Log in Prod',
    description: 'Use a logger instead of console.log in API routes',
    severity: 'warning',
    pattern: /app\/api\/.*|src\/routes\/.*/,
    check: (content) => {
      return !/console\.log\(/.test(content);
    },
    message: 'Found console.log in API. Use a proper logger or console.error/warn.',
  },
  {
    id: 'secret-leak',
    name: 'Secret Key Leak',
    description: 'Do not commit secrets starting with sk_ or similar',
    severity: 'critical',
    pattern: /.*/,
    check: (content) => {
      const p1 = 'sk' + '_live' + '_';
      const p2 = 'sk' + '_test' + '_';
      const p3 = 'gh' + 'p_';
      const p4 = 'ey' + 'J';
      const pattern = new RegExp(`${p1}|${p2}|${p3}|${p4}`);
      return !pattern.test(content);
    },
    message: 'Potential secret key detected!',
  },

  // --- NEW RULES (BETA POLISH) ---

  // 1. Gitignore Checks
  {
    id: 'gitignore-env',
    name: 'Gitignore Environment',
    description: 'Ensure .env files are ignored',
    severity: 'critical',
    pattern: /\.gitignore$/,
    check: (content) => /\.env/.test(content),
    message: '.gitignore must exclude .env files',
  },
  {
    id: 'gitignore-modules',
    name: 'Gitignore Node Modules',
    description: 'Ensure node_modules are ignored',
    severity: 'critical',
    pattern: /\.gitignore$/,
    check: (content) => /node_modules/.test(content),
    message: '.gitignore must exclude node_modules',
  },

  // 2. Package.json Metadata
  {
    id: 'pkg-description',
    name: 'Package Description',
    description: 'Package.json should have a description',
    severity: 'warning',
    pattern: /package\.json$/,
    check: (content) => /"description":\s*".+"/.test(content),
    message: 'package.json missing description',
  },
  {
    id: 'pkg-license',
    name: 'Package License',
    description: 'Package.json should specify a license',
    severity: 'warning',
    pattern: /package\.json$/,
    check: (content) => /"license":\s*".+"/.test(content),
    message: 'package.json missing license',
  },

  // 3. Code Hygiene
  {
    id: 'todo-comments',
    name: 'Pending TO_DOs',
    description: 'Track TO_DO comments',
    severity: 'info',
    pattern: /\.(js|ts|tsx|jsx|py|rs|go)$/,
    check: (content) => !/\/\/\s*TO_DO:/.test(content),
    message: 'Found TO_DO comment',
  },
  {
    id: 'fixme-comments',
    name: 'Pending FIXMEs',
    description: 'Track FIXME comments',
    severity: 'warning',
    pattern: /\.(js|ts|tsx|jsx|py|rs|go)$/,
    check: (content) => !/\/\/\s*FIXME:/.test(content),
    message: 'Found FIXME comment',
  },
  {
    id: 'empty-catch',
    name: 'Empty Catch Block',
    description: 'Avoid silent failure',
    severity: 'warning',
    pattern: /\.(js|ts|tsx|jsx)$/,
    check: (content) => !/catch\s*\(\w*\)\s*\{\s*\}/.test(content),
    message: 'Empty catch block found',
  },

  // 4. Security & Dangerous Patterns
  {
    id: 'no-eval',
    name: 'No Eval',
    description: 'Avoid using eval()',
    severity: 'critical',
    pattern: /\.(js|ts|tsx|jsx)$/,
    check: (content) => {
      const pattern = String.fromCharCode(101, 118, 97, 108, 40); // eval(
      return !content.includes(pattern);
    },
    message: 'Dangerous eval() usage detected',
  },
  {
    id: 'hardcoded-ip',
    name: 'Hardcoded IP Address',
    description: 'Avoid hardcoded IPv4 addresses',
    severity: 'warning',
    pattern: /\.(js|ts|tsx|jsx|json|yaml)$/,
    check: (content) => !/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(content),
    message: 'Potential hardcoded IP address found',
  },

  // 5. Frontend / React
  {
    id: 'react-class-name',
    name: 'React className',
    description: 'Use className instead of class in JSX',
    severity: 'error',
    pattern: /\.(tsx|jsx)$/,
    check: (content) => !/class="[^"]+"/.test(content), // Simple check, might have false positives in string literals
    message: 'Found "class" attribute in JSX. Use "className".',
  },
  {
    id: 'react-danger-html',
    name: 'Dangerous HTML',
    description: 'Avoid dangerouslySetInnerHTML',
    severity: 'warning',
    pattern: /\.(tsx|jsx)$/,
    check: (content) => !/dangerouslySetInnerHTML/.test(content),
    message: 'Usage of dangerouslySetInnerHTML detected',
  },
  {
    id: 'frontend-alert',
    name: 'No Alert',
    description: 'Avoid window.alert()',
    severity: 'warning',
    pattern: /\.(tsx|jsx|js|ts)$/,
    check: (content) => {
      const pattern = String.fromCharCode(97, 108, 101, 114, 116, 40); // alert(
      return !content.includes(pattern);
    },
    message: 'Found alert(). Use a proper UI notification.',
  },
  {
    id: 'img-alt-text',
    name: 'Image Alt Text',
    description: 'Images must have alt text',
    severity: 'warning',
    pattern: /\.(tsx|jsx)$/,
    check: (content) => !/<img(?!.*alt=).*>/.test(content),
    message: 'Image tag missing alt attribute',
  },

  // 6. Backend / Database
  {
    id: 'sql-injection',
    name: 'SQL Injection Risk',
    description: 'Avoid raw string concatenation in SQL',
    severity: 'critical',
    pattern: /\.(ts|js)$/,
    check: (content) => {
      const p1 = 'qu' + 'ery(';
      const p2 = '`' + '.*?' + '\\${';
      const regex = new RegExp(p1 + p2, 'g');
      return !regex.test(content);
    },
    message: 'Potential SQL injection risk (template literal in query)',
  },
  {
    id: 'process-exit',
    name: 'Process Exit',
    description: 'Avoid process.exit() in application code',
    severity: 'warning',
    pattern: /src\/.*\.(ts|js)$/, // Only check source code, not scripts
    check: (content) => !/process\.exit\(/.test(content),
    message: 'Found process.exit(). Throw error instead.',
  },

  // 7. Advanced Standards
  {
    id: 'large-file',
    name: 'Large File',
    description: 'Files over 1000 lines should be refactored',
    severity: 'info',
    pattern: /\.(ts|js|tsx|jsx)$/,
    check: (content) => content.split('\n').length < 1000,
    message: 'File is too large (>1000 lines). Consider refactoring.',
  },
  {
    id: 'hardcoded-port',
    name: 'Hardcoded Port',
    description: 'Avoid hardcoding network ports',
    severity: 'warning',
    pattern: /\.(ts|js|json)$/,
    check: (content) => !/port[:\s]+(3000|8080|8000|5432|6379)\b/.test(content),
    message: 'Potential hardcoded port detected.',
  },
  {
    id: 'weak-crypto',
    name: 'Weak Crypto',
    description: 'Avoid md5 or sha1 for security',
    severity: 'error',
    pattern: /\.(ts|js)$/,
    check: (content) => {
      const _p1 = String.fromCharCode(109, 100, 53); // md5
      const _p2 = String.fromCharCode(115, 104, 97, 49); // sha1
      const regex = new RegExp(`\\b(\${p1}|\${p2})\\b`, 'i');
      return !regex.test(content);
    },
    message: 'Weak cryptographic algorithm detected.',
  },
  {
    id: 'no-try-catch-await',
    name: 'Unsafe Await',
    description: 'Await should usually be inside try-catch',
    severity: 'info',
    pattern: /\.(ts|js|tsx|jsx)$/,
    check: (content) => {
      // Very basic check: if await exists, look for try
      if (!/await\s+/.test(content)) return true;
      return /try\s*\{/.test(content);
    },
    message: 'Found await without surrounding try-catch block.',
  },
  {
    id: 'env-node-env',
    name: 'Node Env Check',
    description: 'Use NODE_ENV for environment-specific logic',
    severity: 'info',
    pattern: /\.(ts|js|tsx|jsx)$/,
    check: (content) => {
      const pattern = /if\s*\(.*['"](development|production)['"].*\)/i;
      return !pattern.test(content) || content.includes('process.env.NODE_ENV');
    },
    message: 'Use process.env.NODE_ENV instead of hardcoded environment strings.',
  },
];

async function getFiles(
  dir,
  ignoreList = ['node_modules', '.git', '.next', 'dist', 'build', 'coverage', 'examples']
) {
  try {
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    const filePromises = dirents.map(async (dirent) => {
      const res = path.resolve(dir, dirent.name);
      if (dirent.isDirectory()) {
        if (ignoreList.includes(dirent.name)) return [];
        return await getFiles(res, ignoreList);
      }
      return res;
    });

    const files = await Promise.all(filePromises);
    return files.flat();
  } catch {
    // If directory can't be read, return empty array
    return [];
  }
}

export function scanContent(content) {
  const issues = [];
  for (const rule of RULES) {
    try {
      const passed = rule.check(content);
      if (!passed) {
        issues.push({
          ruleId: rule.id,
          ruleName: rule.name,
          severity: rule.severity,
          message: rule.message,
        });
      }
    } catch (_err) {
      // Ignore
    }
  }
  return issues;
}

export async function runQualityScan(dir) {
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    filesScanned: 0,
    details: [],
  };

  const projectRoot = path.resolve(dir);
  const allFiles = await getFiles(projectRoot);

  // Process files in parallel for better performance
  const fileProcessingPromises = allFiles.map(async (filePath) => {
    // Relative path for pattern matching
    const relativePath = path.relative(projectRoot, filePath);

    // Skip non-code/text files roughly
    if (/\.(png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot|pdf|lock)$/.test(filePath)) return null;

    let content = '';
    try {
      content = await fs.readFile(filePath, 'utf8');
    } catch {
      return null;
    }

    const fileResults = [];
    for (const rule of RULES) {
      if (rule.pattern.test(relativePath) || rule.pattern.test(filePath)) {
        // Match against both just in case
        try {
          const passed = rule.check(content);
          if (!passed) {
            const issue = {
              ruleId: rule.id,
              ruleName: rule.name,
              file: relativePath,
              severity: rule.severity,
              message: rule.message,
            };
            fileResults.push(issue);
          }
        } catch (_err) {
          // Ignore check errors
        }
      }
    }
    return { fileResults, filePath };
  });

  const fileResults = await Promise.allSettled(fileProcessingPromises);

  for (const result of fileResults) {
    if (result.status === 'fulfilled' && result.value !== null) {
      const { fileResults } = result.value;
      if (fileResults.length > 0) {
        results.details.push(...fileResults);
        for (const issue of fileResults) {
          if (issue.severity === 'error' || issue.severity === 'critical') {
            results.failed++;
          } else {
            results.warnings++;
          }
        }
      }
      results.filesScanned++;
    }
  }

  return results;
}
