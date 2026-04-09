var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __decorateClass = (decorators, target, key, kind) => {
  var result = kind > 1 ? void 0 : kind ? __getOwnPropDesc(target, key) : target;
  for (var i = decorators.length - 1, decorator; i >= 0; i--)
    if ((decorator = decorators[i]))
      result = (kind ? decorator(target, key, result) : decorator(result)) || result;
  if (kind && result) __defProp(target, key, result);
  return result;
};
import { singleton } from 'tsyringe';
import { getProvider } from '../ai/provider-registry.js';
import { createLogger } from '../../../utils/logging.js';
const capabilityMapping = {
  backend: ['nodejs', 'api'],
  frontend: ['react', 'html', 'css'],
  database: ['postgresql', 'mongodb'],
  testing: ['jest', 'cypress'],
  devops: ['docker', 'kubernetes'],
  mobile: ['react-native', 'flutter'],
  ai: ['python', 'tensorflow'],
};
let Planner = class {
  constructor(options = {}) {
    this.providerName = options.providerName || 'openai';
    this.logger = createLogger();
    this.maxIterations = options.maxIterations || 3;
    this.validationSchema = {
      type: 'array',
      items: {
        type: 'object',
        required: ['agent', 'action', 'required'],
        properties: {
          agent: { type: 'string' },
          action: { type: 'string' },
          required: { type: 'array', items: { type: 'string' } },
        },
      },
    };
  }
  async plan(task, mode = 'simple') {
    this.logger.info('Starting task planning', { task, mode });
    let prompt = this.buildPrompt(task, mode);
    let response;
    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
      try {
        response = await this.callLLM(prompt);
        const steps = this.parseAndValidate(response);
        this.logger.info('Planning completed successfully', { stepsCount: steps.length });
        return steps;
      } catch (error) {
        attempts++;
        this.logger.warn('Planning attempt failed', { attempt: attempts, error: error.message });
        if (attempts >= maxAttempts) {
          throw new Error(`Failed to plan task after ${maxAttempts} attempts: ${error.message}`);
        }
        prompt = this.refinePrompt(prompt, error.message);
      }
    }
  }
  buildPrompt(task, mode) {
    const mappingExamples = Object.entries(capabilityMapping)
      .map(([agent, caps]) => `${agent}: ${caps.join(', ')}`)
      .join('; ');
    const basePrompt = `Break down the following task into executable steps for a software development team: "${task}"

Output as a JSON array of objects, where each object has:
- agent: the type of agent or role (e.g., "backend", "frontend", "database", "testing")
- action: a clear, executable action description
- required: array of required capabilities or technologies (e.g., ["nodejs", "react", "postgresql"])

Use the following capability mappings for common agent types as guidance: ${mappingExamples}

`;
    switch (mode) {
      case 'simple':
        return basePrompt + 'Keep it to 3-5 high-level steps.';
      case 'detailed':
        return basePrompt + 'Provide detailed, granular steps with specific technologies.';
      case 'iterative':
        return basePrompt + 'Provide initial steps, then refine based on feedback.';
      default:
        return basePrompt;
    }
  }
  async callLLM(prompt) {
    const provider = getProvider(this.providerName);
    if (!provider) {
      throw new Error(`Provider ${this.providerName} not found`);
    }
    const messages = [
      {
        role: 'system',
        content:
          'You are an expert project planner for software development teams. Always respond with valid JSON.',
      },
      { role: 'user', content: prompt },
    ];
    const response = await provider.chat(messages, { temperature: 0.1 });
    return response.content;
  }
  parseAndValidate(response) {
    try {
      const parsed = JSON.parse(response);
      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array');
      }
      for (const step of parsed) {
        if (!step.agent || typeof step.agent !== 'string') {
          throw new Error('Invalid agent: must be a string');
        }
        if (!step.action || typeof step.action !== 'string') {
          throw new Error('Invalid action: must be a string');
        }
        if (!Array.isArray(step.required)) {
          throw new Error('Invalid required: must be an array');
        }
        if (!step.required.every((cap) => typeof cap === 'string')) {
          throw new Error('Invalid required: must be an array of strings');
        }
      }
      return parsed;
    } catch (error) {
      throw new Error(`Failed to parse LLM response: ${error.message}`);
    }
  }
  refinePrompt(originalPrompt, error) {
    return `${originalPrompt}

Previous attempt failed with error: ${error}
Please ensure the output is valid JSON and follows the exact format specified.`;
  }
  async planIterative(task) {
    let steps = await this.plan(task, 'simple');
    for (let i = 0; i < this.maxIterations; i++) {
      const refined = await this.plan(task, 'detailed');
      steps = this.mergeSteps(steps, refined);
    }
    return steps;
  }
  mergeSteps(existing, refined) {
    return refined.length > existing.length ? refined : existing;
  }
};
Planner = __decorateClass([singleton()], Planner);
var planner_default = Planner;
export { Planner, planner_default as default };
