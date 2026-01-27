/**
 * Parser Utility
 * Parses AI responses into structured output
 */

/**
 * Extract project name from implementation plan
 * @param {string} content - Generated implementation plan
 * @returns {string} Project name
 */
export function extractProjectName(content) {
  // Try to find PROJECT: line
  const projectMatch = content.match(/PROJECT:\s*(.+)/i);
  if (projectMatch) {
    return projectMatch[1].trim();
  }
  
  // Try to find product name in Section 1
  const productMatch = content.match(/Product Vision.*?:\s*(.+?)(?:\.|$)/im);
  if (productMatch) {
    return productMatch[1].trim().slice(0, 50);
  }
  
  return 'My SaaS Project';
}

/**
 * Extract summary from implementation plan
 * @param {string} content - Generated implementation plan
 * @returns {string} Brief summary
 */
export function extractSummary(content) {
  // Find Section 1.1 or Problem Statement
  const visionMatch = content.match(/### 1\.1 Product Vision.*?\n(.+?)(?=\n###|\n##|$)/is);
  if (visionMatch) {
    return visionMatch[1].trim().slice(0, 200);
  }
  
  const problemMatch = content.match(/### 1\.2 Problem Statement.*?\n(.+?)(?=\n###|\n##|$)/is);
  if (problemMatch) {
    return problemMatch[1].trim().slice(0, 200);
  }
  
  return 'A SaaS application';
}

/**
 * Extract tech stack from implementation plan
 * @param {string} content - Generated implementation plan
 * @returns {Object} Tech stack details
 */
export function extractTechStack(content) {
  const defaults = {
    frontend: 'Next.js + TypeScript',
    backend: 'Next.js API Routes',
    database: 'PostgreSQL + Prisma',
    auth: 'NextAuth.js',
    payments: 'Stripe',
    hosting: 'Vercel',
  };
  
  // Try to find tech stack section
  const stackSection = content.match(/## SECTION 15.*?(?=## SECTION 16|$)/is);
  if (!stackSection) return defaults;
  
  const text = stackSection[0];
  
  // Extract each layer
  const frontendMatch = text.match(/Frontend.*?:\s*(.+?)(?=\n|$)/i);
  const backendMatch = text.match(/Backend.*?:\s*(.+?)(?=\n|$)/i);
  const databaseMatch = text.match(/Database.*?:\s*(.+?)(?=\n|$)/i);
  
  return {
    frontend: frontendMatch?.[1]?.trim() || defaults.frontend,
    backend: backendMatch?.[1]?.trim() || defaults.backend,
    database: databaseMatch?.[1]?.trim() || defaults.database,
    auth: defaults.auth,
    payments: defaults.payments,
    hosting: defaults.hosting,
  };
}

/**
 * Validate implementation plan completeness
 * @param {string} content - Generated implementation plan
 * @returns {{complete: boolean, missingSections: number[], percentage: number}}
 */
export function validateCompleteness(content) {
  const missingSections = [];
  
  for (let i = 1; i <= 34; i++) {
    const regex = new RegExp(`## SECTION ${i}:`, 'i');
    if (!regex.test(content)) {
      missingSections.push(i);
    }
  }
  
  const percentage = Math.round(((34 - missingSections.length) / 34) * 100);
  
  return {
    complete: missingSections.length === 0,
    missingSections,
    percentage,
  };
}

/**
 * Split content into sections
 * @param {string} content - Generated implementation plan
 * @returns {Map<number, string>} Map of section number to content
 */
export function splitIntoSections(content) {
  const sections = new Map();
  
  for (let i = 1; i <= 34; i++) {
    const nextSection = i < 34 ? `## SECTION ${i + 1}:` : '═══════════════';
    const regex = new RegExp(`(## SECTION ${i}:.*?)(?=${nextSection}|$)`, 'is');
    const match = content.match(regex);
    
    if (match) {
      sections.set(i, match[1].trim());
    }
  }
  
  return sections;
}

/**
 * Format token usage for display
 * @param {{inputTokens: number, outputTokens: number}} usage
 * @returns {string}
 */
export function formatUsage(usage) {
  const total = usage.inputTokens + usage.outputTokens;
  return `${total.toLocaleString()} tokens (${usage.inputTokens.toLocaleString()} in / ${usage.outputTokens.toLocaleString()} out)`;
}

/**
 * Format cost for display
 * @param {{input: number, output: number, total: number}} cost
 * @returns {string}
 */
export function formatCost(cost) {
  return `$${cost.total.toFixed(4)} (input: $${cost.input.toFixed(4)}, output: $${cost.output.toFixed(4)})`;
}

export default {
  extractProjectName,
  extractSummary,
  extractTechStack,
  validateCompleteness,
  splitIntoSections,
  formatUsage,
  formatCost,
};
