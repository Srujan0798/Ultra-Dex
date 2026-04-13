// Copyright (c) 2026 Ultra-Dex

/**
 * Build Command Utilities
 * Helpers for the AI-assisted build workflow
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Load implementation plan from current directory
 * @param {string} dir - Directory to search
 * @returns {Promise<{content: string, path: string}|null>}
 */
export async function loadImplementationPlan(dir = '.') {
  const possibleNames = ['IMPLEMENTATION-PLAN.md', 'implementation-plan.md', 'PLAN.md', 'plan.md'];

  for (const name of possibleNames) {
    const filePath = path.join(dir, name);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return { content, path: filePath };
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Load context file
 * @param {string} dir - Directory to search
 * @returns {Promise<string|null>}
 */
export async function loadContext(dir = '.') {
  const possibleNames = ['CONTEXT.md', 'context.md'];

  for (const name of possibleNames) {
    try {
      return await fs.readFile(path.join(dir, name), 'utf-8');
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Extract tasks from implementation plan
 * @param {string} planContent - Implementation plan content
 * @returns {Array<{id: string, title: string, section: number, status: string}>}
 */
export function extractTasks(planContent) {
  const tasks = [];

  let currentSection = 0;

  // Track current section
  const lines = planContent.split('\n');
  let lineIndex = 0;

  for (const line of lines) {
    const sectionMatch = line.match(/## SECTION (\d+):/i);
    if (sectionMatch) {
      currentSection = parseInt(sectionMatch[1], 10);
    }

    const taskMatch = line.match(/- \[([ x])\]\s*(.+)/i);
    if (taskMatch) {
      tasks.push({
        id: `task-${tasks.length + 1}`,
        title: taskMatch[2].trim(),
        section: currentSection,
        status: taskMatch[1] === 'x' ? 'complete' : 'pending',
        line: lineIndex,
      });
    }
    lineIndex++;
  }

  return tasks;
}

/**
 * Extract atomic tasks (4-9 hour tasks) from Section 16
 * @param {string} planContent - Implementation plan content
 * @returns {Array<{id: string, title: string, estimate: string, dependencies: string[]}>}
 */
export function extractAtomicTasks(planContent) {
  const tasks = [];

  // Find Section 16 content
  const section16Match = planContent.match(/## SECTION 16:.*?(?=## SECTION 17:|$)/is);
  if (!section16Match) return tasks;

  const section16 = section16Match[0];

  // Match task patterns with estimates
  // e.g., "1. Setup project structure (4h)" or "- [ ] Configure database (6-8h)"
  const taskPatterns = [
    /(?:^|\n)\d+\.\s*(.+?)\s*\((\d+(?:-\d+)?h?)\)/gi,
    /- \[[ x]\]\s*(.+?)\s*\((\d+(?:-\d+)?h?)\)/gi,
    /\|\s*(.+?)\s*\|\s*(\d+(?:-\d+)?\s*h(?:ours?)?)\s*\|/gi,
  ];

  for (const pattern of taskPatterns) {
    let match;
    while ((match = pattern.exec(section16)) !== null) {
      tasks.push({
        id: `atomic-${tasks.length + 1}`,
        title: match[1].trim(),
        estimate: match[2].trim(),
        dependencies: [],
      });
    }
  }

  return tasks;
}

/**
 * Get pending tasks only
 * @param {Array} tasks - All tasks
 * @returns {Array} Pending tasks
 */
export function getPendingTasks(tasks) {
  return tasks.filter((t) => t.status === 'pending');
}

/**
 * Group tasks by section
 * @param {Array} tasks - All tasks
 * @returns {Map<number, Array>} Tasks grouped by section number
 */
export function groupTasksBySection(tasks) {
  const grouped = new Map();

  for (const task of tasks) {
    if (!grouped.has(task.section)) {
      grouped.set(task.section, []);
    }
    grouped.get(task.section).push(task);
  }

  return grouped;
}

/**
 * Format context for AI agent
 * @param {Object} options
 * @returns {string} Formatted context
 */
export function formatAgentContext({ plan, context, task, section }) {
  let formatted = `# Project Context\n\n`;

  if (context) {
    formatted += `## Overview\n\n${context}\n\n`;
  }

  if (task) {
    formatted += `## Current Task\n\n**${task.title}**\n`;
    if (task.estimate) {
      formatted += `- Estimated time: ${task.estimate}\n`;
    }
    if (task.section) {
      formatted += `- From Section ${task.section}\n`;
    }
    formatted += '\n';
  }

  if (section && plan) {
    const sectionContent = extractSection(plan, section);
    if (sectionContent) {
      formatted += `## Relevant Section\n\n${sectionContent}\n\n`;
    }
  }

  formatted += `## Instructions\n\n`;
  formatted += `1. Focus on completing the current task\n`;
  formatted += `2. Follow the implementation plan specifications\n`;
  formatted += `3. Write production-ready code with tests\n`;
  formatted += `4. Document any deviations from the plan\n`;

  return formatted;
}

/**
 * Extract a specific section from the plan
 * @param {string} planContent - Full plan content
 * @param {number} sectionNum - Section number (1-34)
 * @returns {string|null}
 */
export function extractSection(planContent, sectionNum) {
  const nextSection = sectionNum < 34 ? `## SECTION ${sectionNum + 1}:` : '═══════════════';
  const regex = new RegExp(`(## SECTION ${sectionNum}:.*?)(?=${nextSection}|$)`, 'is');
  const match = planContent.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Get section titles
 */
export const SECTION_TITLES = {
  1: 'High-Level Summary',
  2: 'Core Features',
  3: 'User Stories',
  4: 'User Personas',
  5: 'Competitive Analysis',
  6: 'Screen Map',
  7: 'Wireframes',
  8: 'Design System',
  9: 'UI/UX Specifications',
  10: 'Data Model',
  11: 'API Blueprint',
  12: 'System Architecture',
  13: 'Authentication & Authorization',
  14: 'Payment Integration',
  15: 'Tech Stack',
  16: 'Implementation Plan',
  17: 'Timeline',
  18: 'Risk Assessment',
  19: 'Deployment Plan',
  20: 'Testing Strategy',
  21: 'Security Guidelines',
  22: 'Performance Requirements',
  23: 'Monitoring & Logging',
  24: 'Maintenance Plan',
  25: 'Documentation',
  26: 'Analytics',
  27: 'Error Handling',
  28: 'Legal & Compliance',
  29: 'SEO',
  30: 'Internationalization',
  31: 'Accessibility',
  32: 'Feature Flags',
  33: 'AI/ML Integration',
  34: 'Future Roadmap',
};

export default {
  loadImplementationPlan,
  loadContext,
  extractTasks,
  extractAtomicTasks,
  getPendingTasks,
  groupTasksBySection,
  formatAgentContext,
  extractSection,
  SECTION_TITLES,
};
