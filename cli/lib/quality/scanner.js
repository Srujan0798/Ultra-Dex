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
      // Obfuscate regex even further to avoid self-triggering on the string literals
      const p1 = 'sk' + '_live' + '_';
      const p2 = 'sk' + '_test' + '_';
      const p3 = 'gh' + 'p_';
      const p4 = 'ey' + 'J';
      const pattern = new RegExp(`${p1}|${p2}|${p3}|${p4}`);
      return !pattern.test(content);
    },
    message: 'Potential secret key detected!'
  }
];

async function getFiles(dir, ignoreList = ['node_modules', '.git', '.next', 'dist', 'build', 'coverage']) {
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
            fileResults.push(issue);
          }
        } catch (err) {
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
