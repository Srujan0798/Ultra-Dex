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
  monitor: ['watch', 'observe', 'track', 'dashboard'],
  test: ['testing', 'tests', 'spec', 'specs', 'jest', 'vitest'],
  install: ['add', 'get', 'download', 'fetch', 'npm install'],
  configure: ['set', 'config', 'settings', 'options'],
  search: ['find', 'lookup', 'locate', 'query', 'grep'],
  deploy: ['deploy', 'publish', 'ship', 'release', 'push', 'rollout'],
  security: ['security', 'secure', 'safety', 'protect', 'vulnerability'],
};

/**
 * Expanded intent definitions - 50+ commands
 */
const EXPANDED_INTENTS = [
  // Core Development (1-10)
  {
    intent: 'init',
    keywords: ['init', 'new project', 'create project', 'start project', 'setup', 'scaffold', 'bootstrap'],
    description: 'create new project application setup scaffold initialize',
    aliases: ['initialize', 'kickstart', 'begin'],
  },
  {
    intent: 'generate',
    keywords: ['generate', 'plan', 'idea', 'blueprint', 'design', 'mapping', 'manifest'],
    description: 'generate create plan design code component page api',
    aliases: ['gen', 'codegen', 'create'],
  },
  {
    intent: 'build',
    keywords: ['build', 'develop', 'implement', 'code', 'make', 'construct', 'assemble'],
    description: 'build develop implement code construct compile',
    aliases: ['compile', 'bundle', 'package'],
  },
  {
    intent: 'test',
    keywords: ['test', 'run tests', 'testing', 'specs', 'unit test', 'integration test'],
    description: 'test run testing specs unit integration e2e',
    aliases: ['testing', 'specs', 'jest', 'vitest'],
  },
  {
    intent: 'lint',
    keywords: ['lint', 'linting', 'code style', 'eslint', 'prettier'],
    description: 'lint code style eslint prettier format check',
    aliases: ['linting', 'format', 'style'],
  },
  {
    intent: 'format',
    keywords: ['format', 'prettier', 'code format', 'beautify'],
    description: 'format prettier code beautify style',
    aliases: ['prettier', 'beautify'],
  },
  {
    intent: 'clean',
    keywords: ['clean', 'cleanup', 'purge', 'clear cache', 'distclean'],
    description: 'clean cleanup purge clear cache distclean remove',
    aliases: ['cleanup', 'purge'],
  },
  {
    intent: 'scaffold',
    keywords: ['scaffold', 'boilerplate', 'template', 'starter'],
    description: 'scaffold boilerplate template starter generate',
    aliases: ['boilerplate', 'template'],
  },
  {
    intent: 'code-gen',
    keywords: ['code-gen', 'generate code', 'codegen', 'auto generate'],
    description: 'code-gen generate code codegen auto',
    aliases: ['codegen'],
  },
  {
    intent: 'upgrade',
    keywords: ['upgrade', 'update', 'migrate', 'update version'],
    description: 'upgrade update migrate version bump',
    aliases: ['update', 'migrate'],
  },
  // Agent/Swarm (11-20)
  {
    intent: 'agents',
    keywords: ['agent', 'specialist', 'who', 'list agents', 'browse', 'experts', 'team'],
    description: 'agent list show available specialists experts ai bots',
    aliases: ['bots', 'specialists', 'experts'],
  },
  {
    intent: 'swarm',
    keywords: ['swarm', 'pipeline', 'autonomous', 'workflow', 'auto', 'collaborate'],
    description: 'swarm multi-agent pipeline autonomous workflow parallel',
    aliases: ['multi-agent', 'pipeline'],
  },
  {
    intent: 'daemon',
    keywords: ['daemon', 'background', 'service', 'run background'],
    description: 'daemon background service run persistent',
    aliases: ['background', 'service'],
  },
  {
    intent: 'ralph',
    keywords: ['ralph', 'lead agent', 'coordinator', 'orchestrator'],
    description: 'ralph lead agent coordinator orchestrator',
    aliases: ['coordinator', 'orchestrator'],
  },
  {
    intent: 'nexus',
    keywords: ['nexus', 'hub', 'center', 'control'],
    description: 'nexus hub center control command',
    aliases: ['hub', 'center'],
  },
  {
    intent: 'bot',
    keywords: ['bot', 'create bot', 'agent bot', 'custom bot'],
    description: 'bot create custom agent',
    aliases: ['custom-bot'],
  },
  {
    intent: 'brain',
    keywords: ['brain', 'memory', 'context', 'knowledge'],
    description: 'brain memory context knowledge sync',
    aliases: ['memory', 'knowledge'],
  },
  {
    intent: 'memory',
    keywords: ['memory', 'recall', 'remember', 'history'],
    description: 'memory recall remember history',
    aliases: ['recall', 'history'],
  },
  {
    intent: 'rag',
    keywords: ['rag', 'retrieval', 'vector', 'embedding'],
    description: 'rag retrieval vector embedding search',
    aliases: ['retrieval', 'embedding'],
  },
  {
    intent: 'vector-search',
    keywords: ['vector-search', 'semantic search', 'similarity'],
    description: 'vector-search semantic similarity embedding',
    aliases: ['semantic-search'],
  },
  // Quality/Verification (21-30)
  {
    intent: 'audit',
    keywords: ['audit', 'security', 'review', 'check code', 'inspect', 'verify code'],
    description: 'audit security review inspect verify code quality',
    aliases: ['security-audit', 'code-review'],
  },
  {
    intent: 'verify',
    keywords: ['verify', 'validation', 'check', 'confirm'],
    description: 'verify validation check confirm',
    aliases: ['validation', 'confirm'],
  },
  {
    intent: 'check',
    keywords: ['check', 'status check', 'health check', 'diagnose'],
    description: 'check status health diagnose',
    aliases: ['health', 'diagnose'],
  },
  {
    intent: 'quality',
    keywords: ['quality', 'code quality', 'metrics', 'score'],
    description: 'quality code metrics score',
    aliases: ['code-quality', 'metrics'],
  },
  {
    intent: 'review',
    keywords: ['review', 'check', 'look at', 'examine', 'analyze'],
    description: 'review code check examine analyze quality',
    aliases: ['examine', 'analyze'],
  },
  {
    intent: 'doctor',
    keywords: ['doctor', 'fix system', 'check system', 'diagnose', 'repair', 'heal', 'health'],
    description: 'doctor diagnose fix repair health check system',
    aliases: ['diagnose', 'repair', 'heal'],
  },
  {
    intent: 'security',
    keywords: ['security', 'scan', 'vulnerability', 'cve', 'dependabot'],
    description: 'security scan vulnerability cve dependabot',
    aliases: ['scan', 'vulnerability'],
  },
  {
    intent: 'gate',
    keywords: ['gate', 'quality gate', 'checkpoint', 'approval'],
    description: 'gate quality checkpoint approval',
    aliases: ['quality-gate', 'checkpoint'],
  },
  {
    intent: 'governance',
    keywords: ['governance', 'policy', 'compliance', 'rules'],
    description: 'governance policy compliance rules',
    aliases: ['policy', 'compliance'],
  },
  {
    intent: 'reality-check',
    keywords: ['reality-check', 'sanity check', 'ground truth'],
    description: 'reality-check sanity ground truth',
    aliases: ['sanity-check'],
  },
  // Project Management (31-40)
  {
    intent: 'status',
    keywords: ['status', 'how is', 'progress', 'score', 'alignment', 'condition'],
    description: 'status progress check alignment score health',
    aliases: ['progress', 'alignment'],
  },
  {
    intent: 'dashboard',
    keywords: ['dashboard', 'gui', 'web', 'monitor', 'visualize', 'interface'],
    description: 'dashboard web gui interface monitor visualize',
    aliases: ['gui', 'web-ui'],
  },
  {
    intent: 'plan',
    keywords: ['plan', 'roadmap', 'timeline', 'schedule', 'milestone'],
    description: 'plan roadmap timeline schedule milestone',
    aliases: ['roadmap', 'timeline'],
  },
  {
    intent: 'monitor',
    keywords: ['monitor', 'watch', 'observe', 'track', 'metrics'],
    description: 'monitor watch observe track metrics',
    aliases: ['watch', 'observe'],
  },
  {
    intent: 'ledger',
    keywords: ['ledger', 'log', 'record', 'transaction'],
    description: 'ledger log record transaction history',
    aliases: ['log', 'record'],
  },
  {
    intent: 'team',
    keywords: ['team', 'members', 'collaborators', 'contributors'],
    description: 'team members collaborators contributors',
    aliases: ['members', 'collaborators'],
  },
  {
    intent: 'session',
    keywords: ['session', 'workspace', 'context', 'current'],
    description: 'session workspace context current',
    aliases: ['workspace', 'context'],
  },
  {
    intent: 'history',
    keywords: ['history', 'past', 'log', 'trail'],
    description: 'history past log trail',
    aliases: ['past', 'trail'],
  },
  {
    intent: 'undo',
    keywords: ['undo', 'revert', 'rollback', 'back'],
    description: 'undo revert rollback back',
    aliases: ['revert', 'rollback'],
  },
  {
    intent: 'estimate',
    keywords: ['estimate', 'cost', 'time', 'effort'],
    description: 'estimate cost time effort',
    aliases: ['cost', 'effort'],
  },
  // Integration (41-50)
  {
    intent: 'github',
    keywords: ['github', 'git', 'pr', 'pull request', 'issue'],
    description: 'github git pr pull request issue',
    aliases: ['git', 'pr'],
  },
  {
    intent: 'jira',
    keywords: ['jira', 'ticket', 'story', 'epic', 'sprint'],
    description: 'jira ticket story epic sprint',
    aliases: ['ticket', 'story'],
  },
  {
    intent: 'notion',
    keywords: ['notion', 'doc', 'wiki', 'page'],
    description: 'notion doc wiki page',
    aliases: ['doc', 'wiki'],
  },
  {
    intent: 'trello',
    keywords: ['trello', 'board', 'card', 'list'],
    description: 'trello board card list',
    aliases: ['board', 'card'],
  },
  {
    intent: 'mcp',
    keywords: ['mcp', 'server', 'protocol', 'connect'],
    description: 'mcp server protocol connect',
    aliases: ['protocol', 'server'],
  },
  {
    intent: 'serve',
    keywords: ['serve', 'mcp', 'server', 'connect', 'portal', 'listen', 'host'],
    description: 'serve mcp server start listen connect host',
    aliases: ['host', 'listen'],
  },
  {
    intent: 'deploy',
    keywords: ['deploy', 'production', 'release', 'ship', 'rollout'],
    description: 'deploy production release ship rollout',
    aliases: ['production', 'release'],
  },
  {
    intent: 'docker',
    keywords: ['docker', 'container', 'image', 'compose'],
    description: 'docker container image compose',
    aliases: ['container', 'compose'],
  },
  {
    intent: 'k8s',
    keywords: ['k8s', 'kubernetes', 'kubectl', 'pod', 'deployment'],
    description: 'k8s kubernetes kubectl pod deployment',
    aliases: ['kubernetes', 'kubectl'],
  },
  {
    intent: 'cicd',
    keywords: ['cicd', 'ci', 'cd', 'pipeline', 'github actions'],
    description: 'cicd ci cd pipeline github actions',
    aliases: ['ci', 'cd', 'pipeline'],
  },
  // Utilities (51-60)
  {
    intent: 'help',
    keywords: ['help', 'what can', 'how to', 'commands', 'usage', 'tutorial', 'guide'],
    description: 'help assist guide tutorial docs commands usage',
    aliases: ['guide', 'tutorial', 'docs'],
  },
  {
    intent: 'config',
    keywords: ['config', 'configuration', 'settings', 'options', 'preferences'],
    description: 'config configuration settings options preferences',
    aliases: ['configuration', 'settings'],
  },
  {
    intent: 'setup',
    keywords: ['setup', 'install', 'configure', 'initialize'],
    description: 'setup install configure initialize',
    aliases: ['install', 'configure'],
  },
  {
    intent: 'sync',
    keywords: ['sync', 'synchronize', 'update state', 'refresh state', 'brain'],
    description: 'sync synchronize update refresh brain memory state',
    aliases: ['synchronize', 'refresh'],
  },
  {
    intent: 'search',
    keywords: ['search', 'find', 'look for', 'where is', 'locate'],
    description: 'search find lookup locate where query',
    aliases: ['find', 'lookup', 'locate'],
  },
  {
    intent: 'voice',
    keywords: ['voice', 'speech', 'talk', 'listen', 'audio', 'microphone'],
    description: 'voice speech audio listen talk microphone',
    aliases: ['speech', 'audio'],
  },
  {
    intent: 'exit',
    keywords: ['exit', 'quit', 'bye', 'stop', 'close', 'shutdown', 'terminate'],
    description: 'exit quit close stop terminate shutdown bye',
    aliases: ['quit', 'bye', 'shutdown'],
  },
  {
    intent: 'feedback',
    keywords: ['feedback', 'report', 'issue', 'bug', 'suggestion'],
    description: 'feedback report issue bug suggestion',
    aliases: ['report', 'bug'],
  },
  {
    intent: 'telemetry',
    keywords: ['telemetry', 'analytics', 'usage', 'metrics'],
    description: 'telemetry analytics usage metrics',
    aliases: ['analytics', 'usage'],
  },
  {
    intent: 'version',
    keywords: ['version', 'check version', 'current version', 'release notes'],
    description: 'version check current release notes',
    aliases: ['release-notes'],
  },
  {
    intent: 'fix',
    keywords: ['fix', 'repair', 'mend', 'resolve', 'patch', 'broken', 'failing'],
    description: 'fix repair mend resolve patch issues broken failing',
    aliases: ['resolve', 'patch', 'heal'],
  },
];

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

  // Use expanded intents
  const intents = EXPANDED_INTENTS;

  // Priority 1: Direct command names (exact match)
  const directCommands = intents.map((m) => m.intent);
  const firstWord = text.split(' ')[0];
  if (directCommands.includes(firstWord)) {
    return firstWord;
  }

  // Priority 2: Check aliases
  for (const mapping of intents) {
    if (mapping.aliases?.includes(firstWord)) {
      return mapping.intent;
    }
  }

  // Priority 3: Contextual phrase matching
  if (text.includes('how do i') || text.includes('how to')) return 'help';
  if (text.includes('is it working') || text.includes('ready') || text.includes('system health') || text.includes('check health')) return 'doctor';
  if (text.includes('what are you') || text.includes('who are you')) return 'help';
  if (text.includes('build') && (text.includes('fail') || text.includes('fix') || text.includes('broken'))) return 'fix';
  if (text.includes('new saas') || text.includes('new app')) return 'init';
  if (text.includes('run all') || text.includes('run agents')) return 'swarm';
  if (text.includes('check version') || text.includes('what version')) return 'version';
  if (text.includes('run tests') || text.includes('test suite')) return 'test';
  if (text.includes('format code') || text.includes('prettify')) return 'format';
  if (text.includes('security scan') || text.includes('vulnerability')) return 'security';
  if (text.includes('deploy to production') || text.includes('ship it')) return 'deploy';
  if (text.includes('start server') || text.includes('start mcp')) return 'serve';
  if (text.includes('list agents') || text.includes('available agents')) return 'agents';
  if (text.includes('background') || text.includes('run in background')) return 'daemon';
  if (text.includes('sync brain') || text.includes('sync memory')) return 'sync';
  if (text.includes('search code') || text.includes('find in code')) return 'search';
  if (text.includes('vector search') || text.includes('semantic search')) return 'vector-search';
  if (text.includes('code quality') || text.includes('quality metrics')) return 'quality';
  if (text.includes('project status') || text.includes('how is project')) return 'status';

  // Priority 4: Keyword matching with scoring
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

    // Alias match
    if (mapping.aliases) {
      for (const alias of mapping.aliases) {
        if (text.includes(alias)) {
          const score = 0.85;
          if (score > bestScore) {
            bestScore = score;
            bestMatch = mapping.intent;
          }
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

  // Enhanced named entity patterns - 15+ parameter types
  const patterns = {
    projectName: /(?:called|named|project\s+(?:called\s+)?|app\s+(?:called\s+)?|create\s+(?:project\s+)?)([a-z0-9-_]+)/i,
    stack: /(?:stack|framework|with)\s+([a-z0-9-]+)|using\s+(?!model|provider|ai|agent|bot)([a-z0-9-]+)/i,
    file: /(?:file|in)\s+([a-z0-9./-]+\.[a-z]+)/i,
    component: /(?:component|page|api)\s+([A-Za-z0-9]+)/i,
    directory: /(?:dir|directory|folder|path)\s+([a-z0-9./_-]+)/i,
    branch: /(?:branch)\s+([a-z0-9._/-]+)/i,
    provider: /(?:provider|model|ai)\s+([a-z0-9.-]+)|(\b(?!(?:using|with|stack|framework|and|the|for|from)\b)[a-z0-9.-]+)\s+(?:provider|model|ai)/i,
    port: /(?:port)\s*(\d+)/i,
    url: /(?:url|endpoint|api)\s+(https?:\/\/[^\s]+)/i,
    count: /(?:count|number|limit|max)\s*(\d+)/i,
    format: /(?:format|as)\s+(json|yaml|md|html|text)/i,
    template: /(?:template|boilerplate)\s+([a-z0-9-]+)/i,
    agent: /(?:agent|bot|specialist)\s+([a-z0-9-_]+)/i,
    command: /(?:command|cmd)\s+([a-z0-9-]+)/i,
    query: /(?:query|search|for)\s+(.+)/i,
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = input.match(pattern);
    if (match) {
      params[key] = match[1] || match[2];
    }
  }

  // Extract flags - also support natural language
  if (input.includes('--help') || input.includes('-h') || text.includes('how to')) {
    params.help = true;
  }
  if (input.includes('--verbose') || input.includes('-v') || text.includes('verbose') || text.includes('detailed')) {
    params.verbose = true;
  }
  if (input.includes('--force') || input.includes('-f') || text.includes('force') || text.includes('overwrite')) {
    params.force = true;
  }
  if (input.includes('--dry-run') || text.includes('dry run') || text.includes('preview') || text.includes('simulate')) {
    params.dryRun = true;
  }
  if (input.includes('--watch') || input.includes('-w') || text.includes('watch') || text.includes('observe')) {
    params.watch = true;
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
 * Get intent confidence score with enhanced algorithm
 * Returns: { intent, confidence: 0.0-1.0, matchType, alternatives }
 */
export function getIntentConfidence(input) {
  const text = input.toLowerCase().trim();
  const intent = routeIntent(input);
  
  if (!intent) {
    return { intent: null, confidence: 0, matchType: 'none', alternatives: [] };
  }

  // Find the matching intent definition
  const intentDef = EXPANDED_INTENTS.find((i) => i.intent === intent);
  if (!intentDef) {
    return { intent, confidence: 0.5, matchType: 'unknown', alternatives: [] };
  }

  let confidence = 0.5;
  let matchType = 'keyword';

  // Exact intent match at start = highest confidence
  if (text.startsWith(intent)) {
    confidence = 1.0;
    matchType = 'exact';
  }
  // Direct command word match
  else if (text.split(' ')[0] === intent) {
    confidence = 0.95;
    matchType = 'direct';
  }
  // Alias match
  else if (intentDef.aliases?.some((a) => text.startsWith(a))) {
    confidence = 0.9;
    matchType = 'alias';
  }
  // Keyword phrase match
  else if (intentDef.keywords.some((kw) => text === kw)) {
    confidence = 0.85;
    matchType = 'exact-keyword';
  }
  // Contains intent
  else if (text.includes(intent)) {
    confidence = 0.8;
    matchType = 'contains';
  }
  // Contains keyword
  else if (intentDef.keywords.some((kw) => text.includes(kw))) {
    confidence = 0.7;
    matchType = 'keyword';
  }
  // Semantic match only
  else {
    const semanticScore = semanticSimilarity(text, intentDef.description);
    confidence = Math.max(0.5, semanticScore);
    matchType = 'semantic';
  }

  // Boost confidence for longer, more specific inputs
  if (text.split(' ').length >= 4 && confidence < 0.9) {
    confidence = Math.min(0.95, confidence + 0.1);
  }

  // Generate alternatives for low confidence matches
  const alternatives = [];
  if (confidence < 0.7) {
    for (const other of EXPANDED_INTENTS) {
      if (other.intent !== intent) {
        const score = semanticSimilarity(text, other.description);
        if (score > 0.4) {
          alternatives.push({ intent: other.intent, confidence: score });
        }
      }
      if (alternatives.length >= 3) break;
    }
  }

  return { intent, confidence: Math.round(confidence * 100) / 100, matchType, alternatives };
}

/**
 * Get all possible intents for an input (for suggestions)
 */
export function getAllIntents(input, limit = 5) {
  const text = input.toLowerCase().trim();
  const results = [];

  for (const mapping of EXPANDED_INTENTS) {
    let score = 0;

    // Check direct match
    if (text.startsWith(mapping.intent)) {
      score = 1.0;
    }
    // Check aliases
    else if (mapping.aliases?.some((a) => text.startsWith(a))) {
      score = 0.9;
    }
    // Check keywords
    else {
      for (const kw of mapping.keywords) {
        if (text.includes(kw)) {
          score = Math.max(score, 0.5 + kw.length / text.length / 2);
        }
      }
      // Semantic similarity
      const semanticScore = semanticSimilarity(text, mapping.description);
      score = Math.max(score, semanticScore);
    }

    if (score > 0.2) {
      results.push({ intent: mapping.intent, confidence: score });
    }
  }

  results.sort((a, b) => b.confidence - a.confidence);
  return results.slice(0, limit);
}

/**
 * Clarify intent - ask follow-up questions for ambiguous input
 */
export function needsClarification(input, threshold = 0.6) {
  const { intent, confidence, alternatives } = getIntentConfidence(input);
  
  // Needs clarification if:
  // 1. Confidence is below threshold
  // 2. Multiple alternatives with similar confidence
  const needsClarify = confidence < threshold || 
    (alternatives.length > 0 && alternatives[0].confidence > threshold - 0.1);
  
  return {
    needsClarification: needsClarify,
    intent,
    confidence,
    alternatives,
    clarificationQuestion: needsClarify ? generateClarificationQuestion(intent, alternatives) : null,
  };
}

/**
 * Generate clarification question for ambiguous input
 */
function generateClarificationQuestion(primaryIntent, alternatives) {
  const options = [primaryIntent, ...alternatives.slice(0, 2).map((a) => a.intent)].filter(Boolean);

  if (options.length === 0) {
    return 'I could not confidently map that request. Could you rephrase it or use a command name?';
  }

  if (options.length === 1) {
    return `Did you mean "ultra-dex ${options[0]}"?`;
  }

  return `Did you mean: ${options.map((o) => `"ultra-dex ${o}"`).join(' or ')}?`;
}

/**
 * Conversation History Manager for context-aware routing
 */
class ConversationHistory {
  constructor(maxLength = 10) {
    this.history = [];
    this.maxLength = maxLength;
    this.context = {
      lastIntent: null,
      lastParams: null,
      lastCommand: null,
      projectContext: null,
    };
  }

  add(input, intent, params, confidence) {
    this.history.push({
      input,
      intent,
      params,
      confidence,
      timestamp: Date.now(),
    });

    if (this.history.length > this.maxLength) {
      this.history.shift();
    }

    // Update context
    this.context.lastIntent = intent;
    this.context.lastParams = params;
    this.context.lastCommand = intent;

    // Update project context if detected
    if (params?.projectName) {
      this.context.projectContext = params.projectName;
    }
  }

  getHistory(limit = 5) {
    return this.history.slice(-limit);
  }

  getContext() {
    return { ...this.context };
  }

  clear() {
    this.history = [];
    this.context = {
      lastIntent: null,
      lastParams: null,
      lastCommand: null,
      projectContext: null,
    };
  }

  /**
   * Resolve context-dependent references like "it", "that", "the project"
   */
  resolveContextualReference(input) {
    const text = input.toLowerCase();
    
    // Pronoun resolution
    if (text.includes(' it ') || text === 'it' || text.startsWith('it ')) {
      if (this.context.lastIntent) {
        return input.replace(/\bit\b/gi, this.context.lastIntent);
      }
    }
    
    // "that" resolution
    if (text.includes(' that ') || text.startsWith('that ')) {
      if (this.context.lastIntent) {
        return input.replace(/\bthat\b/gi, this.context.lastIntent);
      }
    }
    
    // "the project" resolution
    if (text.includes('the project') || text.includes('this project')) {
      if (this.context.projectContext) {
        return input.replace(/the project|this project/gi, this.context.projectContext);
      }
    }
    
    // "add tests" after a generate command -> add tests to the generated component
    if (text.startsWith('add tests') && this.context.lastParams?.component) {
      return `${input} to ${this.context.lastParams.component}`;
    }
    
    return input;
  }
}

// Export singleton instance
export const conversationHistory = new ConversationHistory();

/**
 * Context-aware intent routing with conversation history
 */
export function routeIntentWithContext(input) {
  // Resolve contextual references first
  const resolvedInput = conversationHistory.resolveContextualReference(input);
  const intent = routeIntent(resolvedInput);
  
  if (intent) {
    const params = extractParams(intent, resolvedInput);
    const confidence = getIntentConfidence(resolvedInput);
    
    // Add to conversation history
    conversationHistory.add(input, intent, params, confidence.confidence);
  }
  
  return intent;
}

/**
 * Get suggestions based on conversation context
 */
export function getContextualSuggestions() {
  const context = conversationHistory.getContext();
  const suggestions = [];
  
  if (context.lastIntent) {
    // Suggest follow-up actions
    const followups = getFollowUpSuggestions(context.lastIntent);
    suggestions.push(...followups);
  }
  
  if (context.projectContext) {
    // Suggest project-specific actions
    suggestions.push({
      intent: 'status',
      description: `Check status of ${context.projectContext}`,
    });
    suggestions.push({
      intent: 'build',
      description: `Build ${context.projectContext}`,
    });
  }
  
  return suggestions.slice(0, 5);
}

/**
 * Get follow-up suggestions based on last intent
 */
function getFollowUpSuggestions(intent) {
  const followupMap = {
    init: [
      { intent: 'generate', description: 'Generate initial code' },
      { intent: 'config', description: 'Configure project settings' },
    ],
    generate: [
      { intent: 'build', description: 'Build the generated code' },
      { intent: 'test', description: 'Run tests' },
    ],
    build: [
      { intent: 'test', description: 'Run tests' },
      { intent: 'deploy', description: 'Deploy the build' },
    ],
    test: [
      { intent: 'fix', description: 'Fix failing tests' },
      { intent: 'audit', description: 'Audit code quality' },
    ],
    audit: [
      { intent: 'fix', description: 'Fix identified issues' },
      { intent: 'security', description: 'Run security scan' },
    ],
    deploy: [
      { intent: 'monitor', description: 'Monitor deployment' },
      { intent: 'status', description: 'Check deployment status' },
    ],
  };
  
  return followupMap[intent] || [];
}
/**
 * Maps NLP intent and params to actual CLI command strings
 */
export function translateToCommand(input) {
  const intent = routeIntent(input);
  if (!intent) return null;

  const params = extractParams(intent, input);
  const text = input.toLowerCase();

  let command = `ultra-dex ${intent}`;

  // Special phrase matching for common natural language requests
  if (text.includes('build') && (text.includes('fail') || text.includes('fix') || text.includes('broken'))) {
    command = 'ultra-dex fix --build';
  } else if (text.includes('system health') || (text.includes('check') && text.includes('health'))) {
    command = 'ultra-dex doctor';
  } else {
    // General mapping based on intent
    switch (intent) {
      case 'init':
        command = `ultra-dex init ${params.projectName || params.value || ''}`.trim();
        break;
      case 'generate':
        command = `ultra-dex generate ${params.component || params.value || ''}`.trim();
        break;
      case 'help':
        command = 'ultra-dex --help';
        break;
      default:
        // Use intent as command name
        command = `ultra-dex ${intent}`;
        break;
    }
  }

  // Append generic flags
  if (params.help && !command.includes('--help')) command += ' --help';
  if (params.verbose) command += ' --verbose';
  if (params.force) command += ' --force';
  if (params.dryRun) command += ' --dry-run';
  if (params.watch) command += ' --watch';
  if (params.provider) command += ` --provider ${params.provider}`;
  if (params.key) command += ` --key ${params.key}`;

  return command.trim();
}

/**
 * Handle errors in router module
 * @param {Error} error - The error to handle
 * @param {string} [context='router'] - Error context
 */
function handleModuleError(error, context = 'router') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
