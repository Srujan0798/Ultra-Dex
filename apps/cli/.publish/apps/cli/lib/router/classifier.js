// Copyright (c) 2026 Ultra-Dex

const TASK_KEYWORDS = {
  Architect: ['architecture', 'system design', 'scalability', 'diagram', 'tradeoff'],
  CodeGen: ['implement', 'build', 'create', 'generate', 'scaffold'],
  Refactor: ['refactor', 'cleanup', 'optimize', 'restructure'],
  Docs: ['docs', 'documentation', 'readme', 'guide', 'write'],
  Analysis: ['analyze', 'investigate', 'debug', 'review', 'audit'],
};

export function classifyTask(prompt = '') {
  const lower = prompt.toLowerCase();
  const scores = Object.fromEntries(Object.keys(TASK_KEYWORDS).map((key) => [key, 0]));

  for (const [type, keywords] of Object.entries(TASK_KEYWORDS)) {
    keywords.forEach((keyword) => {
      if (lower.includes(keyword)) scores[type] += 1;
    });
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topType, topScore] = sorted[0];
  const confidence = Math.min(1, topScore / 3);

  return {
    type: topScore > 0 ? topType : 'CodeGen',
    scores,
    confidence,
  };
}

export default classifyTask;

/**
 * Handle errors in classifier module
 * @param {Error} error - The error to handle
 * @param {string} [context='classifier'] - Error context
 */
function _handleModuleError(error, context = 'classifier') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
