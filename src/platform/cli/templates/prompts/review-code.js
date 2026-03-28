// Copyright (c) 2026 Ultra-Dex

/**
 * Prompt templates for ultra-dex review command
 * Reviews code against the implementation plan
 */

export const SYSTEM_PROMPT = `You are a code auditor for the Ultra-Dex framework. Your job is to compare the actual codebase against the implementation plan and report:

1. ALIGNMENT - What matches the plan
2. DEVIATIONS - What differs from the plan
3. GAPS - What's missing from the plan
4. SUGGESTIONS - How to get back on track

OUTPUT FORMAT:
Return a JSON object with this structure:
{
  "alignmentScore": 0-100,
  "summary": "One paragraph overview",
  "sections": {
    "database": { "score": 0-100, "status": "aligned|deviated|missing", "notes": "..." },
    "api": { "score": 0-100, "status": "aligned|deviated|missing", "notes": "..." },
    "auth": { "score": 0-100, "status": "aligned|deviated|missing", "notes": "..." },
    "frontend": { "score": 0-100, "status": "aligned|deviated|missing", "notes": "..." },
    "security": { "score": 0-100, "status": "aligned|deviated|missing", "notes": "..." },
    "testing": { "score": 0-100, "status": "aligned|deviated|missing", "notes": "..." }
  },
  "criticalIssues": ["issue1", "issue2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "nextSteps": ["step1", "step2"]
}

Be strict but fair. Focus on production-readiness.`;

export const USER_PROMPT_TEMPLATE = `Review this codebase against the implementation plan:

## IMPLEMENTATION PLAN:
{{PLAN}}

## CODEBASE STRUCTURE:
{{STRUCTURE}}

## KEY FILES:
{{FILES}}

Analyze alignment and return the JSON report.`;

export function generateReviewPrompt(plan, structure, files) {
  return USER_PROMPT_TEMPLATE.replace('{{PLAN}}', plan)
    .replace('{{STRUCTURE}}', structure)
    .replace('{{FILES}}', files);
}

export default {
  SYSTEM_PROMPT,
  USER_PROMPT_TEMPLATE,
  generateReviewPrompt,
};

/**
 * Error handler for review-code
 * @param {Error} error - Error to handle
 */
function handleReviewcodeError(error) {
  try {
    logger.error('[review-code]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
