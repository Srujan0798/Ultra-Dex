import fs from 'fs/promises';
import path from 'path';
async function loadImplementationPlan(dir = '.') {
  const possibleNames = ['IMPLEMENTATION-PLAN.md', 'implementation-plan.md', 'PLAN.md', 'plan.md'];
  for (const name of possibleNames) {
    const filePath = path.join(dir, name);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return { content, path: filePath };
    } catch (error) {
      // File doesn't exist or can't be read - try next filename
      continue;
    }
  }
  return null;
}
async function loadContext(dir = '.') {
  const possibleNames = ['CONTEXT.md', 'context.md'];
  for (const name of possibleNames) {
    try {
      return await fs.readFile(path.join(dir, name), 'utf-8');
    } catch (error) {
      // File doesn't exist or can't be read - try next filename
      continue;
    }
  }
  return null;
}
function extractTasks(planContent) {
  const tasks = [];
  let currentSection = 0;
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
function extractAtomicTasks(planContent) {
  const tasks = [];
  const section16Match = planContent.match(/## SECTION 16:.*?(?=## SECTION 17:|$)/is);
  if (!section16Match) return tasks;
  const section16 = section16Match[0];
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
function getPendingTasks(tasks) {
  return tasks.filter((t) => t.status === 'pending');
}
function groupTasksBySection(tasks) {
  const grouped = /* @__PURE__ */ new Map();
  for (const task of tasks) {
    if (!grouped.has(task.section)) {
      grouped.set(task.section, []);
    }
    grouped.get(task.section).push(task);
  }
  return grouped;
}
function formatAgentContext({ plan, context, task, section }) {
  let formatted = `# Project Context

`;
  if (context) {
    formatted += `## Overview

${context}

`;
  }
  if (task) {
    formatted += `## Current Task

**${task.title}**
`;
    if (task.estimate) {
      formatted += `- Estimated time: ${task.estimate}
`;
    }
    if (task.section) {
      formatted += `- From Section ${task.section}
`;
    }
    formatted += '\n';
  }
  if (section && plan) {
    const sectionContent = extractSection(plan, section);
    if (sectionContent) {
      formatted += `## Relevant Section

${sectionContent}

`;
    }
  }
  formatted += `## Instructions

`;
  formatted += `1. Focus on completing the current task
`;
  formatted += `2. Follow the implementation plan specifications
`;
  formatted += `3. Write production-ready code with tests
`;
  formatted += `4. Document any deviations from the plan
`;
  return formatted;
}
function extractSection(planContent, sectionNum) {
  const nextSection =
    sectionNum < 34
      ? `## SECTION ${sectionNum + 1}:`
      : '\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550';
  const regex = new RegExp(`(## SECTION ${sectionNum}:.*?)(?=${nextSection}|$)`, 'is');
  const match = planContent.match(regex);
  return match ? match[1].trim() : null;
}
const SECTION_TITLES = {
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
var build_helpers_default = {
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
export {
  SECTION_TITLES,
  build_helpers_default as default,
  extractAtomicTasks,
  extractSection,
  extractTasks,
  formatAgentContext,
  getPendingTasks,
  groupTasksBySection,
  loadContext,
  loadImplementationPlan,
};
