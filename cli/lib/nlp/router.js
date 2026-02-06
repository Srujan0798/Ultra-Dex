// Copyright (c) 2026 Ultra-Dex

// Ultra-Dex CLI — Enhanced NLP Intent Router
// Maps natural language to internal CLI commands with semantic understanding

/**
 * Semantic similarity scoring using word overlap and synonyms
 */
const synonymMap = {
  create: ['make', 'build', 'start', 'new', 'init', 'setup', 'scaffold'],
  delete: ['remove', 'destroy', 'trash', 'kill', 'drop'],
  run: ['execute', 'start', 'launch', 'invoke', 'trigger'],
  list: ['show', 'display', 'view', 'browse', 'see'],
  help: ['assist', 'guide', 'tutorial', 'docs', 'documentation'],
  check: ['verify', 'validate', 'test', 'inspect', 'review'],
  agent: ['bot', 'assistant', 'ai', 'specialist', 'expert'],
  project: ['app', 'application', 'repo', 'codebase', 'workspace'],
  deploy: ['publish', 'ship', 'release', 'push'],
  monitor: ['watch', 'observe', 'track', 'dashboard'],
};

/**
 * Calculate semantic similarity score between two strings (0-1)
 */
function semanticSimilarity(input, target) {
  const inputWords = new Set(input.toLowerCase().split(/\s+/));
  const targetWords = new Set(target.toLowerCase().split(/\s+/));

  let matchScore = 0;

  for (const word of inputWords) {
    if (targetWords.has(word)) {
      matchScore += 1;
    } else {
      // Check synonyms
      for (const [base, synonyms] of Object.entries(synonymMap)) {
        if (synonyms.includes(word)) {
          if (targetWords.has(base) || synonyms.some((s) => targetWords.has(s))) {
            matchScore += 0.8;
            break;
          }
        }
        if (word === base && synonyms.some((s) => targetWords.has(s))) {
          matchScore += 0.8;
          break;
        }
      }
    }
  }

  const maxLen = Math.max(inputWords.size, targetWords.size);
  return maxLen > 0 ? matchScore / maxLen : 0;
}

/**
 * Fuzzy string distance (Levenshtein-inspired)
 */
function fuzzyMatch(str1, str2) {
  if (str1 === str2) return 1;
  if (str1.includes(str2) || str2.includes(str1)) return 0.9;

  const len1 = str1.length;
  const len2 = str2.length;
  if (Math.abs(len1 - len2) > 5) return 0;

  let matches = 0;
  const minLen = Math.min(len1, len2);
  for (let i = 0; i < minLen; i++) {
    if (str1[i] === str2[i]) matches++;
  }

  return matches / Math.max(len1, len2);
}

/**
 * Enhanced Intent Router with semantic understanding
 */
export function routeIntent(input) {
  if (!input) return null;

  const text = input.toLowerCase().trim();

  // Intent definitions with semantic descriptions
  const intents = [
    {
      intent: 'init',
      keywords: [
        'init',
        'new project',
        'create project',
        'start project',
        'setup',
        'scaffold',
        'bootstrap',
      ],
      description: 'create new project application setup scaffold initialize',
    },
    {
      intent: 'generate',
      keywords: ['generate', 'plan', 'idea', 'blueprint', 'design', 'mapping', 'manifest'],
      description: 'generate create plan design code component page api',
    },
    {
      intent: 'build',
      keywords: ['build', 'develop', 'implement', 'code', 'make', 'construct', 'assemble'],
      description: 'build develop implement code construct compile',
    },
    {
      intent: 'agents',
      keywords: ['agent', 'specialist', 'who', 'list agents', 'browse', 'experts', 'team'],
      description: 'agent list show available specialists experts ai bots',
    },
    {
      intent: 'swarm',
      keywords: ['swarm', 'pipeline', 'autonomous', 'workflow', 'auto', 'collaborate'],
      description: 'swarm multi-agent pipeline autonomous workflow parallel',
    },
    {
      intent: 'status',
      keywords: ['status', 'how is', 'progress', 'score', 'alignment', 'condition'],
      description: 'status progress check alignment score health',
    },
    {
      intent: 'dashboard',
      keywords: ['dashboard', 'gui', 'web', 'monitor', 'visualize', 'interface'],
      description: 'dashboard web gui interface monitor visualize',
    },
    {
      intent: 'doctor',
      keywords: ['doctor', 'fix system', 'check system', 'diagnose', 'repair', 'heal', 'health'],
      description: 'doctor diagnose fix repair health check system',
    },
    {
      intent: 'help',
      keywords: ['help', 'what can', 'how to', 'commands', 'usage', 'tutorial', 'guide'],
      description: 'help assist guide tutorial docs commands usage',
    },
    {
      intent: 'audit',
      keywords: ['audit', 'security', 'review', 'check code', 'inspect', 'verify code'],
      description: 'audit security review inspect verify code quality',
    },
    {
      intent: 'serve',
      keywords: ['serve', 'mcp', 'server', 'connect', 'portal', 'listen', 'host'],
      description: 'serve mcp server start listen connect host',
    },
    {
      intent: 'exit',
      keywords: ['exit', 'quit', 'bye', 'stop', 'close', 'shutdown', 'terminate'],
      description: 'exit quit close stop terminate shutdown bye',
    },
    {
      intent: 'sync',
      keywords: ['sync', 'synchronize', 'update state', 'refresh state', 'brain'],
      description: 'sync synchronize update refresh brain memory state',
    },
    {
      intent: 'voice',
      keywords: ['voice', 'speech', 'talk', 'listen', 'audio', 'microphone'],
      description: 'voice speech audio listen talk microphone',
    },
    {
      intent: 'review',
      keywords: ['review', 'check', 'look at', 'examine', 'analyze'],
      description: 'review code check examine analyze quality',
    },
    {
      intent: 'search',
      keywords: ['search', 'find', 'look for', 'where is', 'locate'],
      description: 'search find lookup locate where query',
    },
  ];

  // Priority 1: Direct command names (exact match)
  const directCommands = intents.map((m) => m.intent);
  const firstWord = text.split(' ')[0];
  if (directCommands.includes(firstWord)) {
    return firstWord;
  }

  // Priority 2: Contextual phrase matching
  if (text.includes('how do i') || text.includes('how to')) return 'help';
  if (text.includes('is it working') || text.includes('ready')) return 'doctor';
  if (text.includes('what are you') || text.includes('who are you')) return 'help';
  if (text.includes('new saas') || text.includes('new app')) return 'init';
  if (text.includes('run all') || text.includes('run agents')) return 'swarm';

  // Priority 3: Keyword matching with scoring
  let bestMatch = null;
  let bestScore = 0;

  for (const mapping of intents) {
    // Direct keyword match
    for (const kw of mapping.keywords) {
      if (text.includes(kw)) {
        const score = kw.length / text.length + 0.5;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = mapping.intent;
        }
      }
    }

    // Semantic similarity with description
    const semanticScore = semanticSimilarity(text, mapping.description);
    if (semanticScore > 0.3 && semanticScore > bestScore) {
      bestScore = semanticScore;
      bestMatch = mapping.intent;
    }

    // Fuzzy match on intent name
    const fuzzyScore = fuzzyMatch(firstWord, mapping.intent);
    if (fuzzyScore > 0.7 && fuzzyScore > bestScore) {
      bestScore = fuzzyScore;
      bestMatch = mapping.intent;
    }
  }

  return bestScore > 0.2 ? bestMatch : null;
}

/**
 * Enhanced parameter extraction with NLP patterns
 */
export function extractParams(intent, input) {
  const text = input.toLowerCase().trim();
  const params = {};

  // Named entity patterns
  const patterns = {
    projectName: /(?:called|named|project|app)\s+([a-z0-9-_]+)/i,
    stack: /(?:using|with|stack)\s+([a-z0-9-]+)/i,
    file: /(?:file|in)\s+([a-z0-9./-]+\.[a-z]+)/i,
    component: /(?:component|page|api)\s+([A-Za-z0-9]+)/i,
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = input.match(pattern);
    if (match) {
      params[key] = match[1];
    }
  }

  // Fallback: extract last meaningful word as value
  if (Object.keys(params).length === 0 && (intent === 'init' || intent === 'generate')) {
    const parts = text
      .split(' ')
      .filter((p) => p.length > 2 && !['the', 'a', 'an', 'new', 'create', 'make'].includes(p));
    if (parts.length > 0) {
      params.value = parts[parts.length - 1];
    }
  }

  return params;
}

/**
 * Get intent confidence score (for UI display)
 */
export function getIntentConfidence(input) {
  const intent = routeIntent(input);
  if (!intent) return { intent: null, confidence: 0 };

  // Calculate confidence based on match quality
  const text = input.toLowerCase();
  if (text.startsWith(intent)) return { intent, confidence: 1.0 };
  if (text.includes(intent)) return { intent, confidence: 0.9 };

  return { intent, confidence: 0.7 };
}
