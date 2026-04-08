// Copyright (c) 2026 Ultra-Dex

const TOOL_PATTERN = />>\s*(READ_CODE|WRITE_CODE|RUN_SHELL|DELEGATE)\s*:/i;

export function truncateText(value: unknown, maxChars = 600): string {
  if (value === undefined || value === null) return '';
  const text = String(value).replace(/\s+/g, ' ').trim();
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(0, maxChars - 3)).trim()}...`;
}

export function summarizePlan(planMarkdown: string, maxLines = 12): string {
  if (!planMarkdown) return '';

  const lines = String(planMarkdown)
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0)
    .slice(0, maxLines)
    .map((line) => truncateText(line, 180));

  return lines.join('\n');
}

export function summarizeState(state: unknown, { maxPhases = 6, maxRecentSteps = 5 }: { maxPhases?: number; maxRecentSteps?: number } = {}): string {
  if (!state || typeof state !== 'object') return '';

  const lines = [];

  if (state.project?.name) {
    lines.push(`Project: ${state.project.name}`);
  }

  if (Array.isArray(state.phases) && state.phases.length > 0) {
    const phases = state.phases.slice(0, maxPhases);
    lines.push('Phases:');
    for (const phase of phases) {
      const label = phase.name || phase.id || 'Unnamed phase';
      const status = phase.status || 'unknown';
      const steps = Array.isArray(phase.steps) ? phase.steps.length : 0;
      lines.push(`- ${truncateText(label, 80)} [${status}] (${steps} steps)`);
    }
  }

  const recentSteps = Array.isArray(state.runtime?.recentSteps)
    ? state.runtime.recentSteps.slice(-maxRecentSteps)
    : [];
  if (recentSteps.length > 0) {
    lines.push('Recent Runtime Steps:');
    for (const step of recentSteps) {
      lines.push(
        `- ${step.agent || 'unknown'} -> ${step.action || 'UNKNOWN'} [${step.status || 'unknown'}] ${truncateText(step.decision || '', 120)}`
      );
    }
  }

  return lines.join('\n');
}

export function summarizeGraph(graph: unknown): string {
  if (!graph) return '';

  const parts = [];
  if (typeof graph.nodeCount === 'number') {
    parts.push(`Files: ${graph.nodeCount}`);
  }
  if (typeof graph.edgeCount === 'number') {
    parts.push(`Dependencies: ${graph.edgeCount}`);
  }

  return parts.join('\n');
}

export function summarizeMemories(memories: Array<Record<string, unknown>>, maxItems = 5): string {
  if (!Array.isArray(memories) || memories.length === 0) return '';

  return memories
    .slice(0, maxItems)
    .map((memory) => {
      const text = truncateText(memory.text || memory.content || '', 180);
      const tags = Array.isArray(memory.tags) && memory.tags.length > 0
        ? ` [tags: ${(memory.tags as string[]).slice(0, 4).join(', ')}]`
        : '';
      return `- ${text}${tags}`;
    })
    .join('\n');
}

export function summarizeInteractionHistory(interactionHistory: Array<Record<string, unknown>>, maxItems = 6): string {
  if (!Array.isArray(interactionHistory) || interactionHistory.length === 0) return '';

  return interactionHistory
    .slice(-maxItems)
    .map((entry) => {
      const agent = entry.agent || 'unknown';
      const action = entry.action || 'UNKNOWN';
      const status = entry.status || 'unknown';
      const decision = truncateText(entry.decision || '', 140);
      return `- ${agent} decided "${decision}" -> ${action} [${status}]`;
    })
    .join('\n');
}

export function buildPromptContextSection({
  contextMarkdown,
  planMarkdown,
  state,
  graph,
  memories,
  interactionHistory,
  history,
}: {
  contextMarkdown?: string;
  planMarkdown?: string;
  state?: unknown;
  graph?: unknown;
  memories?: Array<Record<string, unknown>>;
  interactionHistory?: Array<Record<string, unknown>>;
  history?: string;
} = {}): string {
  const sections = [];

  if (contextMarkdown) {
    sections.push(`## Context\n${truncateText(contextMarkdown, 3000)}`);
  }

  const planSummary = summarizePlan(planMarkdown);
  if (planSummary) {
    sections.push(`## Implementation Plan\n${planSummary}`);
  }

  const stateSummary = summarizeState(state);
  if (stateSummary) {
    sections.push(`## Live State\n${stateSummary}`);
  }

  const graphSummary = summarizeGraph(graph);
  if (graphSummary) {
    sections.push(`## Codebase Graph\n${graphSummary}`);
  }

  const historySummary =
    typeof history === 'string' && history.trim().length > 0
      ? truncateText(history, 1800)
      : summarizeInteractionHistory(interactionHistory);
  if (historySummary) {
    sections.push(`## Execution History\n${historySummary}`);
  }

  const memorySummary = summarizeMemories(memories);
  if (memorySummary) {
    sections.push(`## Relevant Memory\n${memorySummary}`);
  }

  return sections.length > 0 ? `${sections.join('\n\n')}\n\n` : '';
}

export function extractDecision(content: string = ''): string {
  const text = String(content || '').trim();
  if (!text) {
    return 'Respond directly to the user.';
  }

  const decisionMatch = text.match(/^\s*DECISION:\s*(.+)$/im);
  if (decisionMatch?.[1]) {
    return truncateText(decisionMatch[1], 280);
  }

  const toolMatch = text.match(TOOL_PATTERN);
  const beforeTool = toolMatch ? text.slice(0, toolMatch.index).trim() : text;
  if (beforeTool) {
    const paragraph = beforeTool.split(/\n\s*\n/)[0];
    const normalized = paragraph.replace(/\s+/g, ' ').trim();
    if (normalized) {
      return truncateText(normalized, 280);
    }
  }

  if (toolMatch) {
    const toolName = toolMatch[1].toUpperCase();
    const targetMatch = text.match(/["']([^"']+)["']/);
    const target = targetMatch?.[1] ? ` on ${truncateText(targetMatch[1], 120)}` : '';
    return `Execute ${toolName}${target}.`;
  }

  return 'Respond directly to the user.';
}

export function stripDecisionLine(content: string = ''): string {
  return String(content || '')
    .replace(/^\s*DECISION:\s*.+$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function createInteractionSummary({
  agent,
  decision,
  action,
  status,
  output,
  timestamp,
}: {
  agent?: string;
  decision?: string;
  action?: string;
  status?: string;
  output?: string;
  timestamp?: string;
} = {}): Record<string, string> {
  return {
    timestamp: timestamp || new Date().toISOString(),
    agent: agent || 'unknown',
    decision: truncateText(decision || '', 280),
    action: action || 'UNKNOWN',
    status: status || 'unknown',
    output: truncateText(output || '', 280),
  };
}
