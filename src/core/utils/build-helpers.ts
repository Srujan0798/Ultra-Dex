import fs from 'fs/promises';
import path from 'path';
interface LoadedPlan {
  content: string;
  path: string;
}
interface PlanTask {
  id: string;
  title: string;
  section?: number;
  status?: 'complete' | 'pending';
  line?: number;
  estimate?: string;
  dependencies?: string[];
}
interface AgentContextParams {
  plan?: string | null;
  context?: string | null;
  task?: PlanTask | null;
  section?: number | null;
}
async function loadImplementationPlan(dir: string = '.'): Promise<LoadedPlan | null> {
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
async function loadContext(dir: string = '.'): Promise<string | null> {
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
function extractTasks(planContent: string): PlanTask[] {
  const tasks: PlanTask[] = [];
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
function extractAtomicTasks(planContent: string): PlanTask[] {
  const tasks: PlanTask[] = [];
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
function getPendingTasks(tasks: PlanTask[]): PlanTask[] {
  return tasks.filter((t: PlanTask) => t.status === 'pending');
}
function groupTasksBySection(tasks: PlanTask[]): Map<number, PlanTask[]> {
  const grouped = /* @__PURE__ */ new Map<number, PlanTask[]>();
  for (const task of tasks) {
    const section = task.section ?? 0;
    if (!grouped.has(section)) {
      grouped.set(section, []);
    }
    grouped.get(section)?.push(task);
  }
  return grouped;
}
function formatAgentContext({ plan, context, task, section }: AgentContextParams): string {
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
function extractSection(planContent: string, sectionNum: number): string | null {
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
