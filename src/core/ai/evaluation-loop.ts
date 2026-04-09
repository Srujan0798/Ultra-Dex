import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import { createProvider } from '../providers/index.js';
import { modelRouter } from './model-router.js';
import { logger } from '../../utils/logging.js';
const QUALITY_GATES = {
  code: {
    validator: validateCode,
    threshold: 0.8,
    description: 'Code quality must meet standards',
  },
  documentation: {
    validator: validateDocumentation,
    threshold: 0.7,
    description: 'Documentation must be clear and complete',
  },
  analysis: {
    validator: validateAnalysis,
    threshold: 0.85,
    description: 'Analysis must be thorough and accurate',
  },
  refactoring: {
    validator: validateRefactoring,
    threshold: 0.8,
    description: 'Refactoring must preserve functionality',
  },
  default: {
    validator: validateDefault,
    threshold: 0.75,
    description: 'Output must meet basic quality standards',
  },
};
const MODEL_ESCALATION = [
  'gpt-4o-mini',
  'claude-3-haiku',
  'gemini-1.5-flash',
  'gpt-4o',
  'claude-3-5-sonnet',
  'gemini-1.5-pro',
  'claude-3-opus',
];
function heuristicScore(text = '', terms = []) {
  const normalized = String(text || '').trim();
  if (!normalized) return 0;
  let score = Math.min(0.4, normalized.length / 4e3);
  for (const term of terms) {
    if (normalized.toLowerCase().includes(term)) score += 0.1;
  }
  return Math.min(1, score);
}
async function validateCode(output) {
  const score = heuristicScore(output, ['function', 'class', 'const', 'return', 'import']);
  return { score, reasons: ['Heuristic code quality check'] };
}
async function validateDocumentation(output) {
  const score = heuristicScore(output, ['overview', 'example', 'usage', 'steps']);
  return { score, reasons: ['Heuristic documentation quality check'] };
}
async function validateAnalysis(output) {
  const score = heuristicScore(output, ['because', 'therefore', 'tradeoff', 'risk']);
  return { score, reasons: ['Heuristic analysis quality check'] };
}
async function validateRefactoring(output) {
  const score = heuristicScore(output, ['before', 'after', 'improve', 'maintain']);
  return { score, reasons: ['Heuristic refactoring quality check'] };
}
async function validateDefault(output) {
  const score = heuristicScore(output, []);
  return { score, reasons: ['Default heuristic quality check'] };
}
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
    const gate = qualityGate || QUALITY_GATES[modelType] || QUALITY_GATES.default;
    const validator = customValidator || gate.validator;
    let currentModel = options.model || modelRouter.determineModel(prompt).model;
    let attempts = 0;
    let escalationCount = 0;
    printInfo(`\u{1F504} Starting evaluation loop for: ${prompt.substring(0, 50)}...`);
    while (attempts < this.maxRetries) {
      try {
        printInfo(`Attempt ${attempts + 1}/${this.maxRetries} using model: ${currentModel}`);
        const provider = createProvider('openai', { model: currentModel });
        const response = await provider.generate(systemPrompt, prompt);
        const evaluation = await validator(response.content || response, {
          prompt,
          model: currentModel,
          ...options,
        });
        printInfo(`Quality score: ${evaluation.score.toFixed(2)}, Threshold: ${gate.threshold}`);
        if (evaluation.score >= gate.threshold) {
          this.stats.successes++;
          printSuccess(`\u2705 Quality gate passed! Score: ${evaluation.score.toFixed(2)}`);
          return {
            success: true,
            content: response.content || response,
            modelUsed: currentModel,
            evaluation,
            attempts: attempts + 1,
            escalated: escalationCount > 0,
          };
        } else {
          printWarning(`\u274C Quality gate failed. Score: ${evaluation.score.toFixed(2)}`);
          if (
            this.enableEscalation &&
            escalationCount < maxEscalations &&
            attempts < this.maxRetries - 1
          ) {
            const nextModel = this.getNextStrongerModel(currentModel);
            if (nextModel && nextModel !== currentModel) {
              printInfo(`\u2B06\uFE0F  Escalating from ${currentModel} to ${nextModel}`);
              currentModel = nextModel;
              escalationCount++;
              this.stats.escalations++;
            }
          }
        }
        attempts++;
        if (attempts < this.maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1e3 * attempts));
        }
      } catch (error) {
        printError(`AI call failed: ${error.message}`);
        if (attempts === this.maxRetries - 1) {
          this.stats.failures++;
          throw new Error(`All ${this.maxRetries} attempts failed. Last error: ${error.message}`);
        }
        attempts++;
      }
    }
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
      return currentModel;
    }
    return MODEL_ESCALATION[currentIndex + 1];
  }
  /**
   * Validate code output
   */
  async validateCode(content, context = {}) {
    const score = 0.5;
    let feedback = [];
    if (typeof content === 'string') {
      if (content.toLowerCase().includes('error') || content.toLowerCase().includes('failed')) {
        feedback.push('Response contains error indicators');
        return { score: 0.2, feedback };
      }
      if (content.length < 50) {
        feedback.push('Response is too short');
        return { score: 0.3, feedback };
      }
      let calculatedScore = 0.5;
      if (content.includes('function') || content.includes('class') || content.includes('def')) {
        calculatedScore += 0.2;
      }
      if (content.includes('//') || content.includes('/*') || content.includes('#')) {
        calculatedScore += 0.1;
      }
      if (content.toLowerCase().includes('todo') || content.toLowerCase().includes('placeholder')) {
        calculatedScore -= 0.3;
      }
      calculatedScore = Math.max(0.1, Math.min(1, calculatedScore));
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
    if (content.includes('#') || content.includes('##') || content.includes('###')) {
      calculatedScore += 0.2;
    } else {
      feedback.push('Missing proper heading structure');
    }
    if (
      content.toLowerCase().includes('purpose') ||
      content.toLowerCase().includes('description') ||
      content.toLowerCase().includes('usage')
    ) {
      calculatedScore += 0.15;
    }
    if (content.toLowerCase().includes('example') || content.includes('```')) {
      calculatedScore += 0.15;
    }
    if (content.length < 100) {
      calculatedScore -= 0.2;
      feedback.push('Documentation is too brief');
    } else if (content.length > 1e4) {
      calculatedScore -= 0.1;
    }
    calculatedScore = Math.max(0.1, Math.min(1, calculatedScore));
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
    if (
      content.toLowerCase().includes('analysis') ||
      content.toLowerCase().includes('conclusion') ||
      content.toLowerCase().includes('finding')
    ) {
      calculatedScore += 0.2;
    }
    if (
      content.toLowerCase().includes('because') ||
      content.toLowerCase().includes('therefore') ||
      content.toLowerCase().includes('thus')
    ) {
      calculatedScore += 0.15;
    }
    if (
      content.toLowerCase().includes('advantage') ||
      content.toLowerCase().includes('disadvantage') ||
      content.toLowerCase().includes('pro') ||
      content.toLowerCase().includes('con')
    ) {
      calculatedScore += 0.15;
    }
    if (content.length < 200) {
      calculatedScore -= 0.3;
      feedback.push('Analysis is too brief');
    }
    calculatedScore = Math.max(0.1, Math.min(1, calculatedScore));
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
    if (
      content.toLowerCase().includes('refactor') ||
      content.toLowerCase().includes('improve') ||
      content.toLowerCase().includes('optimize')
    ) {
      calculatedScore += 0.2;
    }
    if (content.toLowerCase().includes('before') && content.toLowerCase().includes('after')) {
      calculatedScore += 0.2;
    }
    if (
      content.toLowerCase().includes('performance') ||
      content.toLowerCase().includes('readability') ||
      content.toLowerCase().includes('maintainability')
    ) {
      calculatedScore += 0.15;
    }
    calculatedScore = Math.max(0.1, Math.min(1, calculatedScore));
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
    if (content.length < 50) {
      calculatedScore -= 0.3;
      feedback.push('Response is too short');
    }
    if (content.toLowerCase().includes('sorry') || content.toLowerCase().includes('cannot')) {
      calculatedScore -= 0.2;
      feedback.push('Response indicates inability to help');
    }
    if (content.toLowerCase().includes('please') || content.toLowerCase().includes('thank')) {
      calculatedScore += 0.1;
    }
    calculatedScore = Math.max(0.1, Math.min(1, calculatedScore));
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
const evaluationLoop = new EvaluationLoop();
function registerEvaluationLoopCommand(program) {
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
        printInfo(`\u{1F504} Running evaluation loop for: ${task}`);
        const loop = new EvaluationLoop({
          maxRetries: parseInt(options.maxRetries),
          enableEscalation: options.escalation,
        });
        const result = await loop.executeWithEvaluation(task, {
          modelType: options.type,
          model: options.model,
        });
        if (result.success) {
          printSuccess(`\u2705 Task completed successfully!`);
          printInfo(`Model used: ${result.modelUsed}`);
          printInfo(`Attempts: ${result.attempts}`);
          printInfo(`Escalated: ${result.escalated ? 'Yes' : 'No'}`);
          logger.log(`
Result:
${result.content}`);
        } else {
          printError(`\u274C Task failed to meet quality standards after all attempts`);
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
      printSuccess('\u{1F4CA} Evaluation Loop Statistics:');
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
var evaluation_loop_default = {
  EvaluationLoop,
  evaluationLoop,
  QUALITY_GATES,
  MODEL_ESCALATION,
  registerEvaluationLoopCommand,
};
export { evaluation_loop_default as default, registerEvaluationLoopCommand };
