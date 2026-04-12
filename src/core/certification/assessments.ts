/**
 * Ultra-Dex Certification Assessments
 * Question banks and scoring rubrics for all certification levels
 */

export type CertificationLevel = 'practitioner' | 'architect' | 'expert';
export type QuestionType = 'multiple_choice' | 'code' | 'scenario' | 'practical';

export interface Question {
  id: string;
  level: CertificationLevel;
  type: QuestionType;
  category: string;
  question: string;
  options?: string[]; // For multiple choice
  correctAnswer?: string | string[];
  rubric: ScoringRubric;
  timeLimitMinutes: number;
  points: number;
}

export interface ScoringRubric {
  criteria: string[];
  maxPoints: number;
  partialCredit?: boolean;
  autoGradable: boolean;
}

export interface AssessmentConfig {
  level: CertificationLevel;
  totalQuestions: number;
  timeLimitMinutes: number;
  passingScore: number; // Percentage
  categories: string[];
}

// Assessment configurations per level
export const ASSESSMENT_CONFIGS: Record<CertificationLevel, AssessmentConfig> = {
  practitioner: {
    level: 'practitioner',
    totalQuestions: 20,
    timeLimitMinutes: 30,
    passingScore: 70,
    categories: [
      'CLI Usage',
      'Agent Selection',
      'Basic Routing',
      'Memory Basics',
      'Task Execution',
    ],
  },
  architect: {
    level: 'architect',
    totalQuestions: 30,
    timeLimitMinutes: 60,
    passingScore: 75,
    categories: [
      'Multi-Agent Orchestration',
      'Provider Optimization',
      'Plugin Design',
      'Performance Tuning',
      'Error Handling',
    ],
  },
  expert: {
    level: 'expert',
    totalQuestions: 40,
    timeLimitMinutes: 90,
    passingScore: 80,
    categories: [
      'Custom Provider Integration',
      'Governance Policies',
      'Enterprise Setup',
      'Security Hardening',
      'Advanced Debugging',
    ],
  },
};

// Practitioner Level Questions
export const PRACTITIONER_QUESTIONS: Question[] = [
  {
    id: 'p-001',
    level: 'practitioner',
    type: 'multiple_choice',
    category: 'CLI Usage',
    question: 'Which command runs a task with the Planner agent?',
    options: [
      'ultra-dex run planner "task description"',
      'ultra-dex run -a planner -t "task description"',
      'ultra-dex execute --agent planner "task description"',
      'ultra-dex task create --agent planner "task description"',
    ],
    correctAnswer: 'ultra-dex run -a planner -t "task description"',
    rubric: {
      criteria: ['Correct command syntax'],
      maxPoints: 5,
      autoGradable: true,
    },
    timeLimitMinutes: 2,
    points: 5,
  },
  {
    id: 'p-002',
    level: 'practitioner',
    type: 'multiple_choice',
    category: 'Agent Selection',
    question: 'Which agent is best suited for designing a database schema?',
    options: ['Planner', 'Backend Developer', 'Frontend Developer', 'Code Reviewer'],
    correctAnswer: 'Backend Developer',
    rubric: {
      criteria: ['Correct agent selection'],
      maxPoints: 5,
      autoGradable: true,
    },
    timeLimitMinutes: 1,
    points: 5,
  },
  {
    id: 'p-003',
    level: 'practitioner',
    type: 'scenario',
    category: 'Basic Routing',
    question:
      'You have a task that requires both UI design and API implementation. Which command would you use?',
    options: [
      'ultra-dex run planner "Create a login page with API"',
      'ultra-dex swarm "Create a login page with API" --agents frontend,backend',
      'ultra-dex run frontend "Create a login page" && ultra-dex run backend "Create login API"',
      'Both B and C are valid approaches',
    ],
    correctAnswer: 'Both B and C are valid approaches',
    rubric: {
      criteria: ['Understanding of multi-agent execution', 'Knowledge of swarm command'],
      maxPoints: 10,
      partialCredit: true,
      autoGradable: true,
    },
    timeLimitMinutes: 3,
    points: 10,
  },
  {
    id: 'p-004',
    level: 'practitioner',
    type: 'multiple_choice',
    category: 'Memory Basics',
    question: 'What is the purpose of the Persistent Memory Manager (ppmManager)?',
    options: [
      'To manage AI provider API keys',
      'To store and retrieve task history and context across sessions',
      'To handle network requests to AI providers',
      'To manage plugin installations',
    ],
    correctAnswer: 'To store and retrieve task history and context across sessions',
    rubric: {
      criteria: ['Understanding of memory system'],
      maxPoints: 5,
      autoGradable: true,
    },
    timeLimitMinutes: 2,
    points: 5,
  },
  {
    id: 'p-005',
    level: 'practitioner',
    type: 'code',
    category: 'Task Execution',
    question:
      'Write the command to run a task with cost constraints (max $0.50) using the backend agent.',
    options: [],
    correctAnswer: [
      'ultra-dex run backend "implement user auth" --max-cost 0.50',
      'ultra-dex run -a backend -t "implement user auth" --max-cost 0.50',
    ],
    rubric: {
      criteria: [
        'Correct base command',
        'Agent specification',
        'Cost constraint flag',
        'Task description',
      ],
      maxPoints: 10,
      partialCredit: true,
      autoGradable: true,
    },
    timeLimitMinutes: 3,
    points: 10,
  },
];

// Architect Level Questions
export const ARCHITECT_QUESTIONS: Question[] = [
  {
    id: 'a-001',
    level: 'architect',
    type: 'scenario',
    category: 'Multi-Agent Orchestration',
    question:
      'Design a swarm to refactor a monolithic application into microservices. Describe the agent composition and execution order.',
    rubric: {
      criteria: [
        'Includes Planner agent for decomposition',
        'Includes Backend agent for service implementation',
        'Includes Reviewer agent for validation',
        'Considers dependencies between services',
        'Mentions communication patterns',
      ],
      maxPoints: 20,
      partialCredit: true,
      autoGradable: false,
    },
    timeLimitMinutes: 10,
    points: 20,
  },
  {
    id: 'a-002',
    level: 'architect',
    type: 'multiple_choice',
    category: 'Provider Optimization',
    question:
      'Which routing strategy minimizes cost while maintaining quality for high-volume tasks?',
    options: [
      'Always use the most expensive provider',
      'Bandit router with Thompson Sampling',
      'Random provider selection',
      'Round-robin across all providers',
    ],
    correctAnswer: 'Bandit router with Thompson Sampling',
    rubric: {
      criteria: ['Understanding of cost-quality tradeoffs', 'Knowledge of bandit routing'],
      maxPoints: 10,
      autoGradable: true,
    },
    timeLimitMinutes: 3,
    points: 10,
  },
  {
    id: 'a-003',
    level: 'architect',
    type: 'code',
    category: 'Plugin Design',
    question: 'Write a minimal agent.json manifest for a custom agent that integrates with Jira.',
    rubric: {
      criteria: [
        'Valid JSON structure',
        'Required fields: name, version, description',
        'Capabilities defined',
        'Provider compatibility specified',
        'Category classification',
      ],
      maxPoints: 20,
      partialCredit: true,
      autoGradable: true,
    },
    timeLimitMinutes: 8,
    points: 20,
  },
  {
    id: 'a-004',
    level: 'architect',
    type: 'scenario',
    category: 'Performance Tuning',
    question:
      'A swarm execution is timing out after 60 seconds. Describe your debugging approach and optimization strategy.',
    rubric: {
      criteria: [
        'Check provider latency and health',
        'Consider parallel vs sequential execution',
        'Review task decomposition',
        'Check for memory constraints',
        'Propose specific optimizations',
      ],
      maxPoints: 15,
      partialCredit: true,
      autoGradable: false,
    },
    timeLimitMinutes: 8,
    points: 15,
  },
];

// Expert Level Questions
export const EXPERT_QUESTIONS: Question[] = [
  {
    id: 'e-001',
    level: 'expert',
    type: 'practical',
    category: 'Custom Provider Integration',
    question:
      'Write a provider adapter for a hypothetical AI service "NeuralAPI" with OpenAI-compatible endpoints.',
    rubric: {
      criteria: [
        'Implements provider interface',
        'Handles authentication correctly',
        'Implements chat completion',
        'Error handling for rate limits',
        'Streaming support (optional)',
      ],
      maxPoints: 30,
      partialCredit: true,
      autoGradable: false,
    },
    timeLimitMinutes: 20,
    points: 30,
  },
  {
    id: 'e-002',
    level: 'expert',
    type: 'scenario',
    category: 'Governance Policies',
    question:
      'Design a governance policy that restricts certain agents from accessing production databases. Include audit requirements.',
    rubric: {
      criteria: [
        'Defines clear permission boundaries',
        'Specifies restricted agents/actions',
        'Includes audit logging requirements',
        'Considers emergency override procedures',
        'Addresses compliance requirements',
      ],
      maxPoints: 25,
      partialCredit: true,
      autoGradable: false,
    },
    timeLimitMinutes: 15,
    points: 25,
  },
  {
    id: 'e-003',
    level: 'expert',
    type: 'practical',
    category: 'Enterprise Setup',
    question:
      'Configure a team workspace with RBAC: 2 admins, 5 developers with agent execution rights, 3 viewers. Show configuration files.',
    rubric: {
      criteria: [
        'Team structure defined',
        'Role definitions with permissions',
        'Member assignments',
        'Workspace isolation',
        'Shared memory configuration',
      ],
      maxPoints: 25,
      partialCredit: true,
      autoGradable: false,
    },
    timeLimitMinutes: 15,
    points: 25,
  },
  {
    id: 'e-004',
    level: 'expert',
    type: 'multiple_choice',
    category: 'Security Hardening',
    question: 'Which is the most secure way to store AI provider API keys in Ultra-Dex?',
    options: [
      'Store in config.json file',
      'Use environment variables with encrypted values',
      'Store in agent.json manifests',
      'Hardcode in the CLI source',
    ],
    correctAnswer: 'Use environment variables with encrypted values',
    rubric: {
      criteria: ['Security best practices', 'Understanding of credential management'],
      maxPoints: 10,
      autoGradable: true,
    },
    timeLimitMinutes: 2,
    points: 10,
  },
];

// Get all questions for a level
export function getQuestionsForLevel(level: CertificationLevel): Question[] {
  switch (level) {
    case 'practitioner':
      return PRACTITIONER_QUESTIONS;
    case 'architect':
      return ARCHITECT_QUESTIONS;
    case 'expert':
      return EXPERT_QUESTIONS;
    default:
      return [];
  }
}

// Get questions by category
export function getQuestionsByCategory(level: CertificationLevel, category: string): Question[] {
  return getQuestionsForLevel(level).filter((q) => q.category === category);
}

// Calculate category scores
export function calculateCategoryScores(
  questions: Question[],
  answers: Record<string, { score: number; maxPoints: number }>
): Record<string, { score: number; total: number; percentage: number }> {
  const categoryScores: Record<string, { score: number; total: number; percentage: number }> = {};

  for (const question of questions) {
    if (!categoryScores[question.category]) {
      categoryScores[question.category] = { score: 0, total: 0, percentage: 0 };
    }

    const answer = answers[question.id];
    if (answer) {
      categoryScores[question.category].score += answer.score;
      categoryScores[question.category].total += answer.maxPoints;
    }
  }

  // Calculate percentages
  for (const category in categoryScores) {
    const { score, total } = categoryScores[category];
    categoryScores[category].percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  }

  return categoryScores;
}

export default {
  ASSESSMENT_CONFIGS,
  PRACTITIONER_QUESTIONS,
  ARCHITECT_QUESTIONS,
  EXPERT_QUESTIONS,
  getQuestionsForLevel,
  getQuestionsByCategory,
  calculateCategoryScores,
};
