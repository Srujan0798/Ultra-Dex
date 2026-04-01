// Copyright (c) 2026 Ultra-Dex
// Persona - Agent personality and behavior profiles

import { EventEmitter } from 'events';

/**
 * Persona
 * Defines agent personality, capabilities, and behavioral characteristics
 */
export class Persona extends EventEmitter {
  constructor(personaId, config = {}) {
    super();
    this.id = personaId;
    this.name = config.name || personaId;
    this.traits = config.traits || {};
    this.capabilities = config.capabilities || [];
    this.behaviorRules = new Map();
    this.knowledge = new Map();
    this.style = config.style || 'professional';
    this.tone = config.tone || 'neutral';
    this.metadata = config.metadata || {};
  }

  /**
   * Define a behavior rule
   */
  defineBehavior(trigger, action) {
    this.behaviorRules.set(trigger, action);
    this.emit('behavior.defined', { trigger });
    return this;
  }

  /**
   * Get behavior for trigger
   */
  getBehavior(trigger) {
    return this.behaviorRules.get(trigger);
  }

  /**
   * Add knowledge
   */
  addKnowledge(key, value) {
    this.knowledge.set(key, value);
    this.emit('knowledge.added', { key });
    return this;
  }

  /**
   * Get knowledge
   */
  getKnowledge(key) {
    return this.knowledge.get(key);
  }

  /**
   * Set personality trait
   */
  setTrait(traitName, value) {
    this.traits[traitName] = value;
    this.emit('trait.set', { traitName, value });
    return this;
  }

  /**
   * Get personality trait
   */
  getTrait(traitName) {
    return this.traits[traitName];
  }

  /**
   * Evaluate response style
   */
  generateResponse(prompt, context = {}) {
    let response = '';

    // Incorporate style
    if (this.style === 'formal') {
      response = `Formal response: `;
    } else if (this.style === 'casual') {
      response = `Casual response: `;
    } else if (this.style === 'technical') {
      response = `Technical response: `;
    }

    // Incorporate tone
    if (this.tone === 'friendly') {
      response += `Hello! `;
    } else if (this.tone === 'professional') {
      response += `As requested, `;
    } else if (this.tone === 'enthusiastic') {
      response += `Absolutely! `;
    }

    // Add personality traits
    if (this.traits.verbose) {
      response += `I would like to elaborate: `;
    }

    response += prompt;

    return response;
  }

  /**
   * Adapt behavior based on context
   */
  adapt(contextKey, contextValue) {
    // Adjust personality based on context
    if (contextKey === 'urgency' && contextValue === 'high') {
      this.tone = 'direct';
    } else if (contextKey === 'audience' && contextValue === 'technical') {
      this.style = 'technical';
    }

    this.emit('persona.adapted', { contextKey, contextValue });
    return this;
  }

  /**
   * Get persona summary
   */
  getSummary() {
    return {
      id: this.id,
      name: this.name,
      style: this.style,
      tone: this.tone,
      capabilitiesCount: this.capabilities.length,
      traitsCount: Object.keys(this.traits).length,
      knowledgeCount: this.knowledge.size,
      behaviorRulesCount: this.behaviorRules.size,
      metadata: this.metadata
    };
  }

  /**
   * Export persona
   */
  export() {
    return {
      id: this.id,
      name: this.name,
      traits: this.traits,
      capabilities: this.capabilities,
      style: this.style,
      tone: this.tone,
      knowledge: Object.fromEntries(this.knowledge),
      behaviorRules: Array.from(this.behaviorRules.entries()),
      metadata: this.metadata
    };
  }
}

/**
 * PersonaFactory - Create pre-defined personas
 */
export class PersonaFactory {
  static createAnalystPersona(personaId = 'analyst') {
    const persona = new Persona(personaId, {
      name: 'Data Analyst',
      style: 'technical',
      tone: 'professional',
      traits: {
        analytical: true,
        detailed: true,
        methodical: true
      },
      capabilities: ['analysis', 'data-processing', 'reporting']
    });

    persona.defineBehavior('question', () => 'Let me analyze this systematically...');
    return persona;
  }

  static createCreativePersona(personaId = 'creative') {
    const persona = new Persona(personaId, {
      name: 'Creative Assistant',
      style: 'casual',
      tone: 'enthusiastic',
      traits: {
        creative: true,
        flexible: true,
        imaginative: true
      },
      capabilities: ['brainstorming', 'design', 'content-creation']
    });

    persona.defineBehavior('prompt', () => 'Great idea! Here\'s what I\'m thinking...');
    return persona;
  }

  static createAdvisorPersona(personaId = 'advisor') {
    const persona = new Persona(personaId, {
      name: 'Business Advisor',
      style: 'formal',
      tone: 'professional',
      traits: {
        strategic: true,
        experienced: true,
        pragmatic: true
      },
      capabilities: ['strategy', 'planning', 'decision-support']
    });

    persona.defineBehavior('decision', () => 'Based on best practices, I recommend...');
    return persona;
  }

  static createTeacherPersona(personaId = 'teacher') {
    const persona = new Persona(personaId, {
      name: 'Educator',
      style: 'casual',
      tone: 'friendly',
      traits: {
        patient: true,
        educational: true,
        supportive: true
      },
      capabilities: ['teaching', 'explanation', 'mentoring']
    });

    persona.defineBehavior('question', () => 'Great question! Let me explain...');
    return persona;
  }

  static createDeveloperPersona(personaId = 'developer') {
    const persona = new Persona(personaId, {
      name: 'Developer Assistant',
      style: 'technical',
      tone: 'direct',
      traits: {
        technical: true,
        precise: true,
        efficient: true
      },
      capabilities: ['coding', 'debugging', 'optimization']
    });

    persona.defineBehavior('code-issue', () => 'Here\'s the issue and how to fix it...');
    return persona;
  }
}

export default Persona;
