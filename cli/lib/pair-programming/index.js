/**
 * AI Pair Programming Mode
 * Real-time suggestions, voice command hooks, context-aware completions, agent handoff.
 */

import { EventEmitter } from 'events';
import { getProvider } from '../providers/index.js';
import { authorizeAgentAccess } from '../enterprise/agent-access.js';

export class PairProgrammingSession extends EventEmitter {
  constructor({ agent = 'frontend', context = '', voiceEnabled = false } = {}) {
    super();
    this.agent = agent;
    this.context = context;
    this.voiceEnabled = voiceEnabled;
    this.provider = getProvider();
    this.active = false;
  }

  async start() {
    const access = await authorizeAgentAccess(this.agent);
    if (!access.allowed) {
      throw new Error(`Role ${access.role} cannot run @${this.agent}`);
    }
    if (!this.provider) {
      throw new Error('No AI provider configured');
    }
    this.active = true;
    this.emit('status', { status: 'started', agent: this.agent });
  }

  async stop() {
    this.active = false;
    this.emit('status', { status: 'stopped' });
  }

  async suggest(code, cursorContext = '') {
    if (!this.active) throw new Error('Session not active');
    const systemPrompt = `You are @${this.agent}. Provide concise inline coding suggestions.`;
    const userPrompt = `Context:\n${this.context}\n\nCode:\n${code}\n\nCursor Context:\n${cursorContext}`;
    const result = await this.provider.generate(systemPrompt, userPrompt);
    const suggestion = result.content || '';
    this.emit('suggestion', { suggestion });
    return suggestion;
  }

  async complete(code, cursorContext = '') {
    if (!this.active) throw new Error('Session not active');
    const systemPrompt = `You are @${this.agent}. Provide context-aware completions.`;
    const userPrompt = `Context:\n${this.context}\n\nCode:\n${code}\n\nCursor Context:\n${cursorContext}`;
    const result = await this.provider.generate(systemPrompt, userPrompt);
    return result.content || '';
  }

  async handleVoiceCommand(command) {
    if (!this.voiceEnabled) {
      return { ok: false, message: 'Voice commands disabled' };
    }
    this.emit('voice', { command });
    return { ok: true, command };
  }

  async handoff(newAgent) {
    const access = await authorizeAgentAccess(newAgent);
    if (!access.allowed) {
      throw new Error(`Role ${access.role} cannot run @${newAgent}`);
    }
    this.agent = newAgent;
    this.emit('handoff', { agent: newAgent });
    return newAgent;
  }
}

export function createPairSession(options) {
  return new PairProgrammingSession(options);
}

export default { createPairSession, PairProgrammingSession };
