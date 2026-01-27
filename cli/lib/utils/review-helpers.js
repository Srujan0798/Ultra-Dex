/**
 * Review Command Utilities
 * Helpers for code-to-plan alignment checking
 */

import fs from 'fs/promises';
import path from 'path';
import { extractSection, SECTION_TITLES } from './build-helpers.js';

/**
 * Scan directory for code files
 * @param {string} dir - Directory to scan
 * @param {string[]} extensions - File extensions to include
 * @returns {Promise<string[]>} List of file paths
 */
export async function scanCodeFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go']) {
  const files = [];
  
  async function scan(currentDir) {
    try {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        // Skip common non-code directories
        if (entry.isDirectory()) {
          if (!['node_modules', '.git', '.next', 'dist', 'build', '__pycache__', '.venv'].includes(entry.name)) {
            await scan(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch {
      // Directory not accessible
    }
  }
  
  await scan(dir);
  return files;
}

/**
 * Extract code structure from files
 * @param {string[]} files - List of file paths
 * @returns {Promise<Object>} Code structure analysis
 */
export async function analyzeCodeStructure(files) {
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
    const dir = path.dirname(file);
    
    // Categorize files
    if (relativePath.includes('/components/') || relativePath.includes('/Components/')) {
      structure.components.push(relativePath);
    } else if (relativePath.includes('/api/') || relativePath.includes('/routes/')) {
      structure.apiRoutes.push(relativePath);
    } else if (relativePath.includes('/models/') || relativePath.includes('/schema/') || filename.includes('schema')) {
      structure.models.push(relativePath);
    } else if (relativePath.includes('/services/') || relativePath.includes('/lib/')) {
      structure.services.push(relativePath);
    } else if (relativePath.includes('/test') || relativePath.includes('.test.') || relativePath.includes('.spec.')) {
      structure.tests.push(relativePath);
    } else if (filename.includes('config') || filename.includes('.env')) {
      structure.configs.push(relativePath);
    }
  }
  
  return structure;
}

/**
 * Check alignment between code and plan section
 * @param {string} planContent - Full plan content
 * @param {Object} codeStructure - Analyzed code structure
 * @param {number} sectionNum - Section to check
 * @returns {Object} Alignment result
 */
export function checkSectionAlignment(planContent, codeStructure, sectionNum) {
  const section = extractSection(planContent, sectionNum);
  if (!section) {
    return { section: sectionNum, score: 0, status: 'missing', issues: ['Section not found in plan'] };
  }
  
  const result = {
    section: sectionNum,
    title: SECTION_TITLES[sectionNum] || `Section ${sectionNum}`,
    score: 0,
    status: 'unknown',
    issues: [],
    suggestions: [],
  };
  
  // Section-specific checks
  switch (sectionNum) {
    case 10: // Data Model
      result.score = checkDataModelAlignment(section, codeStructure);
      break;
    case 11: // API Blueprint
      result.score = checkApiAlignment(section, codeStructure);
      break;
    case 13: // Authentication
      result.score = checkAuthAlignment(section, codeStructure);
      break;
    case 20: // Testing Strategy
      result.score = checkTestingAlignment(section, codeStructure);
      break;
    default:
      result.score = 50; // Default partial score for unchecked sections
      result.status = 'not-verified';
      result.issues.push('Automated verification not available for this section');
  }
  
  // Set status based on score
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

/**
 * Check data model alignment (Section 10)
 */
function checkDataModelAlignment(section, codeStructure) {
  let score = 0;
  
  // Check if schema/model files exist
  if (codeStructure.models.length > 0) {
    score += 50;
  }
  
  // Check for Prisma schema
  const hasPrisma = codeStructure.models.some(f => f.includes('prisma') || f.includes('schema.prisma'));
  if (hasPrisma) {
    score += 30;
  }
  
  // Check for migrations
  const hasMigrations = codeStructure.models.some(f => f.includes('migration'));
  if (hasMigrations) {
    score += 20;
  }
  
  return Math.min(score, 100);
}

/**
 * Check API alignment (Section 11)
 */
function checkApiAlignment(section, codeStructure) {
  let score = 0;
  
  // Check if API routes exist
  if (codeStructure.apiRoutes.length > 0) {
    score += 40;
  }
  
  // Count endpoints mentioned in plan vs implemented
  const planEndpoints = (section.match(/(?:GET|POST|PUT|DELETE|PATCH)\s+\/[^\s]+/gi) || []).length;
  const implementedRoutes = codeStructure.apiRoutes.length;
  
  if (planEndpoints > 0) {
    const coverage = Math.min(implementedRoutes / planEndpoints, 1);
    score += Math.round(coverage * 60);
  } else {
    score += 30; // No specific endpoints in plan
  }
  
  return Math.min(score, 100);
}

/**
 * Check authentication alignment (Section 13)
 */
function checkAuthAlignment(section, codeStructure) {
  let score = 0;
  
  // Check for auth-related files
  const authFiles = [...codeStructure.apiRoutes, ...codeStructure.services].filter(f => 
    f.toLowerCase().includes('auth') || 
    f.toLowerCase().includes('login') ||
    f.toLowerCase().includes('session')
  );
  
  if (authFiles.length > 0) {
    score += 50;
  }
  
  // Check for NextAuth config
  const hasNextAuth = codeStructure.configs.some(f => f.includes('auth'));
  if (hasNextAuth) {
    score += 30;
  }
  
  // Check for middleware
  const hasMiddleware = codeStructure.services.some(f => f.includes('middleware'));
  if (hasMiddleware) {
    score += 20;
  }
  
  return Math.min(score, 100);
}

/**
 * Check testing alignment (Section 20)
 */
function checkTestingAlignment(section, codeStructure) {
  let score = 0;
  
  // Check if test files exist
  if (codeStructure.tests.length > 0) {
    score += 40;
  }
  
  // Calculate test coverage ratio (tests vs code files)
  const codeFiles = codeStructure.components.length + codeStructure.apiRoutes.length + codeStructure.services.length;
  if (codeFiles > 0) {
    const testRatio = codeStructure.tests.length / codeFiles;
    score += Math.min(Math.round(testRatio * 100), 60);
  }
  
  return Math.min(score, 100);
}

/**
 * Generate alignment report
 * @param {Object[]} results - Section alignment results
 * @returns {Object} Full report
 */
export function generateAlignmentReport(results) {
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const avgScore = Math.round(totalScore / results.length);
  
  const complete = results.filter(r => r.status === 'complete').length;
  const partial = results.filter(r => r.status === 'partial').length;
  const incomplete = results.filter(r => r.status === 'incomplete').length;
  const missing = results.filter(r => r.status === 'missing').length;
  
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
      .filter(r => r.score < 70)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .map(r => ({
        section: r.section,
        title: r.title,
        score: r.score,
        issues: r.issues,
      })),
  };
}

/**
 * Get letter grade from score
 */
function getGrade(score) {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Format report for CLI output
 * @param {Object} report - Alignment report
 * @returns {string} Formatted output
 */
export function formatReportForCLI(report) {
  let output = '';
  
  output += `\n╔════════════════════════════════════════╗\n`;
  output += `║     Ultra-Dex Alignment Report         ║\n`;
  output += `╚════════════════════════════════════════╝\n\n`;
  
  output += `Overall Score: ${report.overallScore}% (Grade: ${report.grade})\n\n`;
  
  output += `Summary:\n`;
  output += `  ✅ Complete:   ${report.summary.complete} sections\n`;
  output += `  ⚠️  Partial:    ${report.summary.partial} sections\n`;
  output += `  ❌ Incomplete: ${report.summary.incomplete} sections\n`;
  output += `  ⬜ Missing:    ${report.summary.missing} sections\n\n`;
  
  if (report.topIssues.length > 0) {
    output += `Top Issues:\n`;
    for (const issue of report.topIssues) {
      output += `  • Section ${issue.section} (${issue.title}): ${issue.score}%\n`;
      for (const i of issue.issues) {
        output += `    - ${i}\n`;
      }
    }
  }
  
  return output;
}

export default {
  scanCodeFiles,
  analyzeCodeStructure,
  checkSectionAlignment,
  generateAlignmentReport,
  formatReportForCLI,
};
