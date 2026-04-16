import { logger } from './logging.js';
interface TechStack {
  frontend: string;
  backend: string;
  database: string;
  auth: string;
  payments: string;
  hosting: string;
}
interface CompletenessResult {
  complete: boolean;
  missingSections: number[];
  percentage: number;
}
interface UsageSummary {
  inputTokens: number;
  outputTokens: number;
}
interface CostSummary {
  total: number;
  input: number;
  output: number;
}
function extractProjectName(content: string): string {
  const projectMatch = content.match(/PROJECT:\s*(.+)/i);
  if (projectMatch) {
    return projectMatch[1].trim();
  }
  const productMatch = content.match(/Product Vision.*?:\s*(.+?)(?:\.|$)/im);
  if (productMatch) {
    return productMatch[1].trim().slice(0, 50);
  }
  return 'My SaaS Project';
}
function extractSummary(content: string): string {
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
function extractTechStack(content: string): TechStack {
  const defaults: TechStack = {
    frontend: 'Next.js + TypeScript',
    backend: 'Next.js API Routes',
    database: 'PostgreSQL + Prisma',
    auth: 'NextAuth.js',
    payments: 'Stripe',
    hosting: 'Vercel',
  };
  const stackSection = content.match(/## SECTION 15.*?(?=## SECTION 16|$)/is);
  if (!stackSection) return defaults;
  const text = stackSection[0];
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
function validateCompleteness(content: string): CompletenessResult {
  const missingSections: number[] = [];
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
function splitIntoSections(content: string): Map<number, string> {
  const sections = /* @__PURE__ */ new Map<number, string>();
  for (let i = 1; i <= 34; i++) {
    const nextSection =
      i < 34
        ? `## SECTION ${i + 1}:`
        : '\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550';
    const regex = new RegExp(`(## SECTION ${i}:.*?)(?=${nextSection}|$)`, 'is');
    const match = content.match(regex);
    if (match) {
      sections.set(i, match[1].trim());
    }
  }
  return sections;
}
function formatUsage(usage: UsageSummary): string {
  const total = usage.inputTokens + usage.outputTokens;
  return `${total.toLocaleString()} tokens (${usage.inputTokens.toLocaleString()} in / ${usage.outputTokens.toLocaleString()} out)`;
}
function formatCost(cost: CostSummary): string {
  return `$${cost.total.toFixed(4)} (input: $${cost.input.toFixed(4)}, output: $${cost.output.toFixed(4)})`;
}
var parser_default = {
  extractProjectName,
  extractSummary,
  extractTechStack,
  validateCompleteness,
  splitIntoSections,
  formatUsage,
  formatCost,
};
function _handleModuleError(error: unknown, context: string = 'parser'): void {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {}
}
export {
  parser_default as default,
  extractProjectName,
  extractSummary,
  extractTechStack,
  formatCost,
  formatUsage,
  splitIntoSections,
  validateCompleteness,
};
