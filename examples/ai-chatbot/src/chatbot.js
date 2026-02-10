/**
 * @fileoverview Chatbot module
 * @module src/chatbot
 */

export function generateReply(message = '', history = []) {
  const cleaned = message.trim().toLowerCase();

  if (!cleaned) {
    return "Tell me what you'd like to build, and I'll help you break it down.";
  }

  if (cleaned.includes('pricing')) {
    return 'Pricing depends on your target market. Consider a freemium tier plus usage-based plans.';
  }

  if (cleaned.includes('auth') || cleaned.includes('login')) {
    return 'Start with OAuth + email magic links. Add RBAC once roles are defined.';
  }

  if (cleaned.includes('roadmap')) {
    return 'Ship MVP first: onboarding, core workflow, billing. Then add analytics and automation.';
  }

  if (cleaned.endsWith('?')) {
    return 'That is a great question. Here is a structured approach: define scope, map dependencies, then estimate effort.';
  }

  const last = history.length > 0 ? history[history.length - 1] : null;
  if (last && last.role === 'assistant') {
    return 'Got it. Want me to draft an implementation plan or suggest agents to handle this?';
  }

  return `Here is a focused response: break the task into steps, pick the right tools, and validate quickly.`;
}

export function summarizeConversation(history = []) {
  if (!history.length) return 'No conversation yet.';
  const userMessages = history.filter((item) => item.role === 'user').map((item) => item.content);
  return `You asked about: ${userMessages.slice(-3).join(' | ')}`;
}

/**
 * Error handler for chatbot
 * @param {Error} error - Error to handle
 */
function handleChatbotError(error) {
  try {
    console.error('[chatbot]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
