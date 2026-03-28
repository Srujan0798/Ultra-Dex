// Copyright (c) 2026 Ultra-Dex

/**
 * Evaluation Loops (Self-Healing)
 * Wrap AI calls in evaluation loop; if output fails quality gate, escalate to stronger model
 */

import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import { createProvider } from '../providers/index.js';
import { modelRouter } from './model-router.js';

// Quality gates for different types of outputs
// Quality gates moved inside class or resolved dynamically
const QUALITY_GATES_CONFIG = {
  code: {
    threshold: 0.8,
    description: 'Code quality must meet standards',
  },
  documentation: {
    threshold: 0.7,
    description: 'Documentation must be clear and complete',
  },
  analysis: {
    threshold: 0.85,
    description: 'Analysis must be thorough and accurate',
  },
  refactoring: {
    threshold: 0.8,
    description: 'Refactoring must preserve functionality',
  },
  default: {
    threshold: 0.75,
    description: 'Output must meet basic quality standards',
  },
};

// Model escalation hierarchy
const MODEL_ESCALATION = [
  'gpt-4o-mini',
  'claude-3-haiku',
  'gemini-1.5-flash',
  'gpt-4o',
  'claude-3-5-sonnet',
  'gemini-1.5-pro',
  'claude-3-opus',
];

class EvaluationLoop {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.qualityThreshold = options.qualityThreshold || 0.75;
    this.enableEscalation = options.enableEscalation !== false;
    this.stats = {
      attempts: 0,
      escalations: 0,
      successes: 0,
      failures: 0,
    };
  }

  /**
   * Execute an AI call with evaluation loop
   */
  async executeWithEvaluation(prompt, options = {}) {
    const {
      systemPrompt = '',
      modelType = 'default',
      qualityGate = null,
      maxEscalations = 2,
      customValidator = null,
    } = options;

    this.stats.attempts++;

    // Determine the quality gate to use
    const gateConfig = QUALITY_GATES_CONFIG[modelType] || QUALITY_GATES_CONFIG.default;

    // Resolve validator method name
    const validatorMethodName = `validate${modelType.charAt(0).toUpperCase() + modelType.slice(1)}`;
    const defaultValidator = this[validatorMethodName]
      ? this[validatorMethodName].bind(this)
      : this.validateDefault.bind(this);

    const validator = customValidator || defaultValidator;
    const threshold = gateConfig.threshold;

    let currentModel = options.model || modelRouter.determineModel(prompt).model;
    let attempts = 0;
    let escalationCount = 0;

    printInfo(`🔄 Starting evaluation loop for: ${prompt.substring(0, 50)}...`);

    while (attempts < this.maxRetries) {
      try {
        printInfo(`Attempt ${attempts + 1}/${this.maxRetries} using model: ${currentModel}`);

        // Make the AI call
        const provider = createProvider('openai', { model: currentModel }); // Simplified
        const response = await provider.generate(systemPrompt, prompt);

        // Evaluate the response
        const evaluation = await validator(response.content || response, {
          prompt,
          model: currentModel,
          ...options,
        });

        printInfo(`Quality score: ${evaluation.score.toFixed(2)}, Threshold: ${threshold}`);

        // Check if quality gate passes
        if (evaluation.score >= threshold) {
          this.stats.successes++;
          printSuccess(`✅ Quality gate passed! Score: ${evaluation.score.toFixed(2)}`);
          return {
            success: true,
            content: response.content || response,
            modelUsed: currentModel,
            evaluation,
            attempts: attempts + 1,
            escalated: escalationCount > 0,
          };
        } else {
          printWarning(`❌ Quality gate failed. Score: ${evaluation.score.toFixed(2)}`);

          // Check if we should escalate to a stronger model
          if (
            this.enableEscalation &&
            escalationCount < maxEscalations &&
            attempts < this.maxRetries - 1
          ) {
            const nextModel = this.getNextStrongerModel(currentModel);
            if (nextModel && nextModel !== currentModel) {
              printInfo(`⬆️  Escalating from ${currentModel} to ${nextModel}`);
              currentModel = nextModel;
              escalationCount++;
              this.stats.escalations++;
            }
          }
        }

        attempts++;

        // Add delay between attempts to be respectful to API
        if (attempts < this.maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempts)); // Exponential backoff
        }
      } catch (error) {
        printError(`AI call failed: ${error.message}`);

        if (attempts === this.maxRetries - 1) {
          this.stats.failures++;
          throw new Error(`All ${this.maxRetries} attempts failed. Last error: ${error.message}`);
        }

        attempts++; // Count failed API calls as attempts too
      }
    }

    // If we get here, all attempts failed
    this.stats.failures++;
    return {
      success: false,
      modelUsed: currentModel,
      attempts,
      escalated: escalationCount > 0,
      error: 'All attempts failed to meet quality threshold',
    };
  }

  /**
   * Get the next stronger model in the hierarchy
   */
  getNextStrongerModel(currentModel) {
    const currentIndex = MODEL_ESCALATION.indexOf(currentModel);
    if (currentIndex === -1 || currentIndex >= MODEL_ESCALATION.length - 1) {
      return currentModel; // Already at strongest or unknown model
    }

    return MODEL_ESCALATION[currentIndex + 1];
  }

  /**
   * Validate code output
   */
  async validateCode(content, context = {}) {
    const score = 0.5; // Placeholder - in real implementation, this would analyze the code
    let feedback = [];

    // Check for basic code structure
    if (typeof content === 'string') {
      if (content.toLowerCase().includes('error') || content.toLowerCase().includes('failed')) {
        feedback.push('Response contains error indicators');
        return { score: 0.2, feedback };
      }

      if (content.length < 50) {
        feedback.push('Response is too short');
        return { score: 0.3, feedback };
      }

      // More sophisticated code validation would go here
      // - Syntax checking
      // - Logic validation
      // - Best practices
      // - Security checks

      // For now, return a basic score based on length and keywords
      let calculatedScore = 0.5;

      // Bonus for including code-like structures
      if (content.includes('function') || content.includes('class') || content.includes('def')) {
        calculatedScore += 0.2;
      }

      // Bonus for including comments
      if (content.includes('//') || content.includes('/*') || content.includes('#')) {
        calculatedScore += 0.1;
      }

      // Penalty for placeholder content
      if (content.toLowerCase().includes('todo') || content.toLowerCase().includes('placeholder')) {
        calculatedScore -= 0.3;
      }

      calculatedScore = Math.max(0.1, Math.min(1.0, calculatedScore));

      return {
        score: calculatedScore,
        feedback: [`Basic code validation completed`],
      };
    }

    return { score: 0.1, feedback: ['Invalid content type'] };
  }

  /**
   * Validate documentation output
   */
  async validateDocumentation(content, context = {}) {
    if (typeof content !== 'string') {
      return { score: 0.1, feedback: ['Invalid content type'] };
    }

    let calculatedScore = 0.5;
    const feedback = [];

    // Check for documentation structure
    if (content.includes('#') || content.includes('##') || content.includes('###')) {
      calculatedScore += 0.2; // Has headings
    } else {
      feedback.push('Missing proper heading structure');
    }

    // Check for explanations
    if (
      content.toLowerCase().includes('purpose') ||
      content.toLowerCase().includes('description') ||
      content.toLowerCase().includes('usage')
    ) {
      calculatedScore += 0.15;
    }

    // Check for examples
    if (content.toLowerCase().includes('example') || content.includes('```')) {
      calculatedScore += 0.15;
    }

    // Length check
    if (content.length < 100) {
      calculatedScore -= 0.2;
      feedback.push('Documentation is too brief');
    } else if (content.length > 10000) {
      calculatedScore -= 0.1; // Too verbose
    }

    calculatedScore = Math.max(0.1, Math.min(1.0, calculatedScore));

    return {
      score: calculatedScore,
      feedback,
    };
  }

  /**
   * Validate analysis output
   */
  async validateAnalysis(content, context = {}) {
    if (typeof content !== 'string') {
      return { score: 0.1, feedback: ['Invalid content type'] };
    }

    let calculatedScore = 0.5;
    const feedback = [];

    // Check for analytical structure
    if (
      content.toLowerCase().includes('analysis') ||
      content.toLowerCase().includes('conclusion') ||
      content.toLowerCase().includes('finding')
    ) {
      calculatedScore += 0.2;
    }

    // Check for evidence/reasoning
    if (
      content.toLowerCase().includes('because') ||
      content.toLowerCase().includes('therefore') ||
      content.toLowerCase().includes('thus')
    ) {
      calculatedScore += 0.15;
    }

    // Check for multiple perspectives
    if (
      content.toLowerCase().includes('advantage') ||
      content.toLowerCase().includes('disadvantage') ||
      content.toLowerCase().includes('pro') ||
      content.toLowerCase().includes('con')
    ) {
      calculatedScore += 0.15;
    }

    // Length check
    if (content.length < 200) {
      calculatedScore -= 0.3;
      feedback.push('Analysis is too brief');
    }

    calculatedScore = Math.max(0.1, Math.min(1.0, calculatedScore));

    return {
      score: calculatedScore,
      feedback,
    };
  }

  /**
   * Validate refactoring output
   */
  async validateRefactoring(content, context = {}) {
    if (typeof content !== 'string') {
      return { score: 0.1, feedback: ['Invalid content type'] };
    }

    let calculatedScore = 0.5;
    const feedback = [];

    // Check for refactoring indicators
    if (
      content.toLowerCase().includes('refactor') ||
      content.toLowerCase().includes('improve') ||
      content.toLowerCase().includes('optimize')
    ) {
      calculatedScore += 0.2;
    }

    // Check for before/after structure
    if (content.toLowerCase().includes('before') && content.toLowerCase().includes('after')) {
      calculatedScore += 0.2;
    }

    // Check for performance or readability improvements
    if (
      content.toLowerCase().includes('performance') ||
      content.toLowerCase().includes('readability') ||
      content.toLowerCase().includes('maintainability')
    ) {
      calculatedScore += 0.15;
    }

    calculatedScore = Math.max(0.1, Math.min(1.0, calculatedScore));

    return {
      score: calculatedScore,
      feedback,
    };
  }

  /**
   * Default validation
   */
  async validateDefault(content, context = {}) {
    if (typeof content !== 'string') {
      return { score: 0.1, feedback: ['Invalid content type'] };
    }

    let calculatedScore = 0.5;
    const feedback = [];

    // Basic quality checks
    if (content.length < 50) {
      calculatedScore -= 0.3;
      feedback.push('Response is too short');
    }

    if (content.toLowerCase().includes('sorry') || content.toLowerCase().includes('cannot')) {
      calculatedScore -= 0.2;
      feedback.push('Response indicates inability to help');
    }

    if (content.toLowerCase().includes('please') || content.toLowerCase().includes('thank')) {
      calculatedScore += 0.1; // Politeness bonus
    }

    calculatedScore = Math.max(0.1, Math.min(1.0, calculatedScore));

    return {
      score: calculatedScore,
      feedback,
    };
  }

  /**
   * Get evaluation statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      attempts: 0,
      escalations: 0,
      successes: 0,
      failures: 0,
    };
  }
}

// Global instance
const evaluationLoop = new EvaluationLoop();

/**
 * Register evaluation loop command
 */
export function registerEvaluationLoopCommand(program) {
  const evalCmd = program
    .command('eval-loop')
    .alias('evaluation')
    .description('AI evaluation loops with self-healing');

  evalCmd
    .command('run')
    .description('Run a task through the evaluation loop')
    .argument('<task>', 'Task to evaluate')
    .option(
      '-t, --type <type>',
      'Task type (code, documentation, analysis, refactoring)',
      'default'
    )
    .option('-m, --model <model>', 'Specific model to start with')
    .option('-r, --max-retries <n>', 'Maximum retries', '3')
    .option('-e, --no-escalation', 'Disable model escalation')
    .action(async (task, options) => {
      try {
        printInfo(`🔄 Running evaluation loop for: ${task}`);

        const loop = new EvaluationLoop({
          maxRetries: parseInt(options.maxRetries),
          enableEscalation: options.escalation,
        });

        const result = await loop.executeWithEvaluation(task, {
          modelType: options.type,
          model: options.model,
        });

        if (result.success) {
          printSuccess(`✅ Task completed successfully!`);
          printInfo(`Model used: ${result.modelUsed}`);
          printInfo(`Attempts: ${result.attempts}`);
          printInfo(`Escalated: ${result.escalated ? 'Yes' : 'No'}`);
          logger.log(`\nResult:\n${result.content}`);
        } else {
          printError(`❌ Task failed to meet quality standards after all attempts`);
        }
      } catch (error) {
        printError(`Evaluation loop failed: ${error.message}`);
      }
    });

  evalCmd
    .command('stats')
    .description('Show evaluation loop statistics')
    .action(() => {
      const stats = evaluationLoop.getStats();
      printSuccess('📊 Evaluation Loop Statistics:');
      printInfo(`  Attempts: ${stats.attempts}`);
      printInfo(`  Escalations: ${stats.escalations}`);
      printInfo(`  Successes: ${stats.successes}`);
      printInfo(`  Failures: ${stats.failures}`);
      if (stats.attempts > 0) {
        const successRate = ((stats.successes / stats.attempts) * 100).toFixed(1);
        printInfo(`  Success Rate: ${successRate}%`);
      }
    });

  evalCmd._examples = [
    {
      command: 'ultra-dex eval-loop run "Write a React component"',
      description: 'Run code generation through evaluation loop',
    },
    {
      command: 'ultra-dex eval-loop run "Explain quantum computing" --type analysis',
      description: 'Run analysis with evaluation',
    },
    { command: 'ultra-dex eval-loop stats', description: 'Show evaluation statistics' },
  ];
}

export default {
  EvaluationLoop,
  evaluationLoop,
  QUALITY_GATES: QUALITY_GATES_CONFIG,
  MODEL_ESCALATION,
  registerEvaluationLoopCommand,
};
