import fs from 'fs/promises';
import path from 'path';
import { extractSection, SECTION_TITLES } from './build-helpers.js';
async function scanCodeFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go']) {
  const files = [];
  async function scan(currentDir) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          if (
            !['node_modules', '.git', '.next', 'dist', 'build', '__pycache__', '.venv'].includes(
              entry.name
            )
          ) {
            await scan(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Directory may not exist or be accessible - skip silently
    }
  }
  await scan(dir);
  return files;
}
async function analyzeCodeStructure(files) {
  const structure = {
    components: [],
    apiRoutes: [],
    models: [],
    services: [],
    tests: [],
    configs: [],
  };
  for (const file of files) {
    const relativePath = file;
    const filename = path.basename(file);
    if (relativePath.includes('/components/') || relativePath.includes('/Components/')) {
      structure.components.push(relativePath);
    } else if (relativePath.includes('/api/') || relativePath.includes('/routes/')) {
      structure.apiRoutes.push(relativePath);
    } else if (
      relativePath.includes('/models/') ||
      relativePath.includes('/schema/') ||
      filename.includes('schema')
    ) {
      structure.models.push(relativePath);
    } else if (relativePath.includes('/services/') || relativePath.includes('/lib/')) {
      structure.services.push(relativePath);
    } else if (
      relativePath.includes('/test') ||
      relativePath.includes('.test.') ||
      relativePath.includes('.spec.')
    ) {
      structure.tests.push(relativePath);
    } else if (filename.includes('config') || filename.includes('.env')) {
      structure.configs.push(relativePath);
    }
  }
  return structure;
}
function checkSectionAlignment(planContent, codeStructure, sectionNum) {
  const section = extractSection(planContent, sectionNum);
  if (!section) {
    return {
      section: sectionNum,
      score: 0,
      status: 'missing',
      issues: ['Section not found in plan'],
    };
  }
  const result = {
    section: sectionNum,
    title: SECTION_TITLES[sectionNum] || `Section ${sectionNum}`,
    score: 0,
    status: 'unknown',
    issues: [],
    suggestions: [],
  };
  switch (sectionNum) {
    case 10:
      result.score = checkDataModelAlignment(section, codeStructure);
      break;
    case 11:
      result.score = checkApiAlignment(section, codeStructure);
      break;
    case 13:
      result.score = checkAuthAlignment(section, codeStructure);
      break;
    case 20:
      result.score = checkTestingAlignment(section, codeStructure);
      break;
    default:
      result.score = 50;
      result.status = 'not-verified';
      result.issues.push('Automated verification not available for this section');
  }
  if (result.score >= 90) {
    result.status = 'complete';
  } else if (result.score >= 70) {
    result.status = 'partial';
  } else if (result.score >= 30) {
    result.status = 'incomplete';
  } else {
    result.status = 'missing';
  }
  return result;
}
function checkDataModelAlignment(section, codeStructure) {
  let score = 0;
  if (codeStructure.models.length > 0) {
    score += 50;
  }
  const hasPrisma = codeStructure.models.some(
    (f) => f.includes('prisma') || f.includes('schema.prisma')
  );
  if (hasPrisma) {
    score += 30;
  }
  const hasMigrations = codeStructure.models.some((f) => f.includes('migration'));
  if (hasMigrations) {
    score += 20;
  }
  return Math.min(score, 100);
}
function checkApiAlignment(section, codeStructure) {
  let score = 0;
  if (codeStructure.apiRoutes.length > 0) {
    score += 40;
  }
  const planEndpoints = (section.match(/(?:GET|POST|PUT|DELETE|PATCH)\s+\/[^\s]+/gi) || []).length;
  const implementedRoutes = codeStructure.apiRoutes.length;
  if (planEndpoints > 0) {
    const coverage = Math.min(implementedRoutes / planEndpoints, 1);
    score += Math.round(coverage * 60);
  } else {
    score += 30;
  }
  return Math.min(score, 100);
}
function checkAuthAlignment(section, codeStructure) {
  let score = 0;
  const authFiles = [...codeStructure.apiRoutes, ...codeStructure.services].filter(
    (f) =>
      f.toLowerCase().includes('auth') ||
      f.toLowerCase().includes('login') ||
      f.toLowerCase().includes('session')
  );
  if (authFiles.length > 0) {
    score += 50;
  }
  const hasNextAuth = codeStructure.configs.some((f) => f.includes('auth'));
  if (hasNextAuth) {
    score += 30;
  }
  const hasMiddleware = codeStructure.services.some((f) => f.includes('middleware'));
  if (hasMiddleware) {
    score += 20;
  }
  return Math.min(score, 100);
}
function checkTestingAlignment(section, codeStructure) {
  let score = 0;
  if (codeStructure.tests.length > 0) {
    score += 40;
  }
  const codeFiles =
    codeStructure.components.length +
    codeStructure.apiRoutes.length +
    codeStructure.services.length;
  if (codeFiles > 0) {
    const testRatio = codeStructure.tests.length / codeFiles;
    score += Math.min(Math.round(testRatio * 100), 60);
  }
  return Math.min(score, 100);
}
function generateAlignmentReport(results) {
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const avgScore = Math.round(totalScore / results.length);
  const complete = results.filter((r) => r.status === 'complete').length;
  const partial = results.filter((r) => r.status === 'partial').length;
  const incomplete = results.filter((r) => r.status === 'incomplete').length;
  const missing = results.filter((r) => r.status === 'missing').length;
  return {
    overallScore: avgScore,
    grade: getGrade(avgScore),
    summary: {
      complete,
      partial,
      incomplete,
      missing,
      total: results.length,
    },
    sections: results,
    topIssues: results
      .filter((r) => r.score < 70)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .map((r) => ({
        section: r.section,
        title: r.title,
        score: r.score,
        issues: r.issues,
      })),
  };
}
function getGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}
function formatReportForCLI(report) {
  let output = '';
  output += `
\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557
`;
  output += `\u2551     Ultra-Dex Alignment Report         \u2551
`;
  output += `\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D

`;
  output += `Overall Score: ${report.overallScore}% (Grade: ${report.grade})

`;
  output += `Summary:
`;
  output += `  \u2705 Complete:   ${report.summary.complete} sections
`;
  output += `  \u26A0\uFE0F  Partial:    ${report.summary.partial} sections
`;
  output += `  \u274C Incomplete: ${report.summary.incomplete} sections
`;
  output += `  \u2B1C Missing:    ${report.summary.missing} sections

`;
  if (report.topIssues.length > 0) {
    output += `Top Issues:
`;
    for (const issue of report.topIssues) {
      output += `  \u2022 Section ${issue.section} (${issue.title}): ${issue.score}%
`;
      for (const i of issue.issues) {
        output += `    - ${i}
`;
      }
    }
  }
  return output;
}
var review_helpers_default = {
  scanCodeFiles,
  analyzeCodeStructure,
  checkSectionAlignment,
  generateAlignmentReport,
  formatReportForCLI,
};
export {
  analyzeCodeStructure,
  checkSectionAlignment,
  review_helpers_default as default,
  formatReportForCLI,
  generateAlignmentReport,
  scanCodeFiles,
};
