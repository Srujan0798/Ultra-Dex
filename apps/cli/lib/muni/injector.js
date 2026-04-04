// Copyright (c) 2026 Ultra-Dex

/**
 * @fileoverview MUNI context injector - Injects stored context into agent prompts
 * @module muni/injector
 */

import { contextDB } from './database.js';

class ContextInjector {
  constructor() {
    this.injectionTemplates = new Map();
  }

  registerTemplate(name, templateFn) {
    this.injectionTemplates.set(name, templateFn);
  }

  async injectContext(prompt, sessionId, context = {}) {
    const entries = await contextDB.query({ sessionId, limit: 20 });

    let contextSection = '';

    if (entries.length > 0) {
      contextSection = '\n\n## Previous Context\n\n';
      contextSection += 'The following relevant context has been retrieved:\n\n';

      for (const entry of entries.slice(0, 10)) {
        contextSection += `### [${entry.type}] ${entry.agent}\n`;
        contextSection += `Session: ${entry.session_id}\n`;
        contextSection += `Content: ${entry.content}\n\n`;
      }
    }

    // Apply custom injection templates
    for (const [name, templateFn] of this.injectionTemplates) {
      try {
        const injected = templateFn(context, entries);
        if (injected) {
          contextSection += `\n### ${name}\n${injected}\n`;
        }
      } catch (error) {
        // Skip failed template injections
      }
    }

    return prompt + contextSection;
  }

  async injectFileContext(prompt, filePath, sessionId) {
    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(filePath, 'utf8');

      // Store file content as context
      await contextDB.store({
        sessionId,
        agent: 'system',
        type: 'file',
        content: content.slice(0, 10000), // Limit to 10KB
        metadata: { filePath, fileName: filePath.split('/').pop() },
        tags: ['file', 'context'],
      });

      // Inject file context into prompt
      const injected = `\n\n## File Context: ${filePath}\n\n\`\`\`\n${content.slice(0, 5000)}\n\`\`\`\n`;
      return prompt + injected;
    } catch {
      return prompt;
    }
  }

  async injectAgentHistory(prompt, agent, sessionId) {
    const history = await contextDB.query({
      sessionId,
      agent,
      type: 'action',
      limit: 5,
    });

    if (history.length === 0) return prompt;

    let historySection = '\n\n## Your Recent Actions\n\n';
    for (const entry of history) {
      historySection += `- ${entry.metadata.action || 'action'}: ${entry.content}\n`;
    }

    return prompt + historySection;
  }

  clearTemplate(name) {
    this.injectionTemplates.delete(name);
  }
}

export const injector = new ContextInjector();

export { ContextInjector };
export default ContextInjector;
