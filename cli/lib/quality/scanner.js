import fs from 'fs/promises';
import path from 'path';

// Define the Quality Rules
const RULES = [
  {
    id: 'api-zod-validation',
    name: 'API Input Validation',
    description: 'API endpoints must validate input using Zod',
    severity: 'error',
    // Regex based pattern matching for file path
    pattern: /app\/api\/.*\.ts|src\/routes\/.*\.ts|pages\/api\/.*\.ts/,
    check: (content) => {
      const isApi = /NextRequest|NextResponse|express\.Router|fastify/.test(content);
      if (!isApi) return true;
      return /import.*zod|require\(['"]zod['"]\)/.test(content);
    },
    message: 'API files must import "zod" for validation.'
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
    message: 'Found explicit "any" type. Use unknown or a specific type.'
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
    message: 'Found console.log in API. Use a proper logger or console.error/warn.'
  },
  {
    id: 'secret-leak',
    name: 'Secret Key Leak',
    description: 'Do not commit secrets starting with sk_ or similar',
    severity: 'critical',
    pattern: /.*/,
    check: (content) => {
      return !/(sk_live_|sk_test_|ghp_|eyJ)/.test(content);
    },
    message: 'Potential secret key detected!'
  }
];

async function getFiles(dir) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    if (dirent.isDirectory()) {
      if (['node_modules', '.git', '.next', 'dist', 'build'].includes(dirent.name)) return [];
      return getFiles(res);
    }
    return res;
  }));
  return files.flat();
}

export async function runQualityScan(dir) {
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    filesScanned: 0,
    details: []
  };

  const projectRoot = path.resolve(dir);
  const allFiles = await getFiles(projectRoot);

  for (const filePath of allFiles) {
    // Relative path for pattern matching
    const relativePath = path.relative(projectRoot, filePath);
    
    // Skip non-code/text files roughly
    if (/\.(png|jpg|jpeg|gif|ico|woff|woff2|ttf|eot|pdf|lock)$/.test(filePath)) continue;

    let content = '';
    try {
      content = await fs.readFile(filePath, 'utf8');
    } catch { continue; }
    
    results.filesScanned++;

    for (const rule of RULES) {
      if (rule.pattern.test(relativePath) || rule.pattern.test(filePath)) { // Match against both just in case
        try {
          const passed = rule.check(content);
          if (!passed) {
            const issue = {
              ruleId: rule.id,
              ruleName: rule.name,
              file: relativePath,
              severity: rule.severity,
              message: rule.message
            };
            results.details.push(issue);

            if (rule.severity === 'error' || rule.severity === 'critical') {
              results.failed++;
            } else {
              results.warnings++;
            }
          }
        } catch (err) {
          // Ignore check errors
        }
      }
    }
  }

  return results;
}
