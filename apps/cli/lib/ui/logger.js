// Copyright (c) 2026 Ultra-Dex

import { theme, status } from './theme.js';
import { isDoomsdayMode } from '../utils/theme-state.js';
import { redact } from '../utils/redactor.js';

// Enhanced agent personas with distinct voices
const AGENT_PERSONAS = {
  professional: {
    name: 'Professional',
    success: (message) => `✅ ${message || 'System secured.'}`,
    failure: (message) =>
      `⚠️ ${message || 'Encountered obstacle. Implementing corrective measures.'}`,
    waiting: (message) => `⏳ ${message || 'Awaiting confirmation...'}`,
    thinking: (message) => `🤔 ${message || 'Analyzing options...'}`,
    completed: (message) => `✅ ${message || 'Task completed successfully.'}`,
    paused: (message) => `⏸️ ${message || 'Temporarily paused for review.'}`,
    alert: (message) => `🚨 ${message || 'Critical issue detected.'}`,
  },
  fun: {
    name: 'Fun',
    success: (message) => `✅ ${message || 'Nailed it!'}`,
    failure: (message) => `⚠️ ${message || 'Oops! Hit a snag. Working on a fix...'}`,
    waiting: (message) => `⏳ ${message || 'Hold tight, still cooking...'}`,
    thinking: (message) => `💭 ${message || 'Let me think about this...'}`,
    completed: (message) => `🎉 ${message || 'All done! How was that?'}`,
    paused: (message) => `⏸️ ${message || 'Taking a quick break...'}`,
    alert: (message) => `🚨 ${message || 'Whoa, something urgent came up!'}`,
  },
  doomsday: {
    name: 'Doomsday',
    success: (message) => `✅ ${message || 'The realm is secure.'}`,
    failure: (message) => `⚠️ ${message || 'A threat approaches. Countermeasures engaged.'}`,
    waiting: (message) => `⏳ ${message || 'Standing by, Avenger...'}`,
    thinking: (message) => `🔮 ${message || 'Scrying for optimal solutions...'}`,
    completed: (message) => `⚔️ ${message || 'Victory is ours.'}`,
    paused: (message) => `🛡️ ${message || 'Regrouping for next assault.'}`,
    alert: (message) => `🔔 ${message || 'The bell tolls for incoming threats.'}`,
  },
  assistant: {
    name: 'Assistant',
    success: (message) => `✅ ${message || 'Successfully completed.'}`,
    failure: (message) => `⚠️ ${message || 'Encountered an issue. How can I assist further?'}`,
    waiting: (message) => `⏳ ${message || 'Processing your request...'}`,
    thinking: (message) => `💡 ${message || 'Considering the best approach...'}`,
    completed: (message) => `✅ ${message || 'Task finished. What else can I help with?'}`,
    paused: (message) => `⏸️ ${message || 'Paused. Resume when ready.'}`,
    alert: (message) => `🔔 ${message || 'Important notification.'}`,
  },
  robot: {
    name: 'Robot',
    success: (message) => `🤖 ${message || 'Task completed. Affirmative.'}`,
    failure: (message) => `❌ ${message || 'Error. Unable to complete task. Retrying...'}`,
    waiting: (message) => `🕐 ${message || 'Waiting for input. Standing by.'}`,
    thinking: (message) => `⚙️ ${message || 'Processing. Calculating optimal solution...'}`,
    completed: (message) => `✅ ${message || 'Task completed. Ready for next instruction.'}`,
    paused: (message) => `⏸️ ${message || 'Execution paused. Awaiting further commands.'}`,
    alert: (message) => `🚨 ${message || 'Critical system alert. Immediate attention required.'}`,
  },
};

class Logger {
  constructor() {
    this.level = 'info';
    this.quiet = false;
    this.persona = 'professional';
    this.agentName = null; // Optional agent name for personalized messages
  }

  setQuiet(quiet) {
    this.quiet = quiet;
  }

  setPersona(personaName) {
    if (AGENT_PERSONAS[personaName]) {
      this.persona = personaName;
    }
  }

  setAgentName(agentName) {
    this.agentName = agentName;
  }

  getPersona() {
    if (isDoomsdayMode()) return AGENT_PERSONAS.doomsday;
    return AGENT_PERSONAS[this.persona] || AGENT_PERSONAS.professional;
  }

  info(message, detail = '') {
    if (this.quiet) return;
    const safeDetail = redact(detail);
    const detailText = safeDetail ? theme.dim(` · ${safeDetail}`) : '';
    console.log(`  ${status.info} ${redact(message)}${detailText}`);
  }

  success(message, detail = '') {
    if (this.quiet) return;
    const persona = this.getPersona();
    const safeDetail = redact(detail);
    const detailText = safeDetail ? theme.dim(` · ${safeDetail}`) : '';

    // Apply persona-specific messaging
    const personaMessage = persona.success(redact(message));
    console.log(`  ${personaMessage}${detailText}`);
  }

  warn(message, detail = '') {
    if (this.quiet) return;
    const persona = this.getPersona();
    const safeDetail = redact(detail);
    const detailText = safeDetail ? theme.dim(` · ${safeDetail}`) : '';

    // Apply persona-specific messaging
    const personaMessage = persona.failure(redact(message));
    console.log(`  ${personaMessage}${detailText}`);
  }

  error(message, error = null) {
    if (this.quiet) return;
    const persona = this.getPersona();
    const personaMessage = persona.alert(redact(message));
    console.log(`  ${personaMessage}`);

    if (error) {
      const safeError = redact(error);
      if (safeError.message) {
        console.log(`    ${theme.dim('→')} ${theme.dim(safeError.message)}`);
      }
      if (safeError.stack && process.env.DEBUG) {
        console.log(
          theme.dim(
            safeError.stack
              .split('\n')
              .map((line) => `      ${line}`)
              .join('\n')
          )
        );
      }
    }
  }

  debug(message, detail = '') {
    if (this.quiet || !process.env.DEBUG) return;
    const safeDetail = redact(detail);
    const detailText = safeDetail ? theme.dim(` · ${safeDetail}`) : '';
    console.log(`  ${theme.dim('⚙')} ${theme.dim(redact(message))}${detailText}`);
  }

  step(current, total, message) {
    if (this.quiet) return;
    const stepText = theme.dim(`[${current}/${total}]`);
    console.log(`  ${stepText} ${redact(message)}`);
  }

  header(text) {
    if (this.quiet) return;
    console.log('');
    const safeText = redact(text);
    console.log(theme.title(`  ${safeText}`));
    console.log(theme.primary('  ' + '─'.repeat(Math.max(10, safeText.length + 4))));
  }

  spacer() {
    if (this.quiet) return;
    console.log('');
  }

  // Enhanced methods with persona-specific messages
  thinking(message = '') {
    if (this.quiet) return;
    const persona = this.getPersona();
    const personaMessage = persona.thinking(redact(message));
    console.log(`  ${personaMessage}`);
  }

  waiting(message = '') {
    if (this.quiet) return;
    const persona = this.getPersona();
    const personaMessage = persona.waiting(redact(message));
    console.log(`  ${personaMessage}`);
  }

  completed(message = '') {
    if (this.quiet) return;
    const persona = this.getPersona();
    const personaMessage = persona.completed(redact(message));
    console.log(`  ${personaMessage}`);
  }

  paused(message = '') {
    if (this.quiet) return;
    const persona = this.getPersona();
    const personaMessage = persona.paused(redact(message));
    console.log(`  ${personaMessage}`);
  }

  alert(message = '') {
    if (this.quiet) return;
    const persona = this.getPersona();
    const personaMessage = persona.alert(redact(message));
    console.log(`  ${personaMessage}`);
  }

  // Method to get all available personas
  getAvailablePersonas() {
    return Object.keys(AGENT_PERSONAS);
  }

  // Method to get persona description
  getPersonaDescription(personaName) {
    return AGENT_PERSONAS[personaName] ? AGENT_PERSONAS[personaName].name : 'Unknown';
  }
}

export const logger = new Logger();
export default logger;

// Export convenience functions
export function printSuccess(message) {
  logger.success(message);
}

export function printInfo(message) {
  logger.info(message);
}

export function printError(message) {
  logger.error(message);
}

export function printWarning(message) {
  logger.warn(message);
}

export function printTable(data) {
  // Simple table printing implementation
  for (const row of data) {
    const formattedRow = row.map((cell) => String(cell)).join('\t');
    console.log(formattedRow);
  }
}

/**
 * Error handler for logger
 * @param {Error} error - Error to handle
 */
function _handleError(error) {
  try {
    process.stderr.write(`[logger] ${error instanceof Error ? error.message : String(error)}\n`);
  } catch (_) {
    // Fail silently
  }
}
