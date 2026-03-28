// Copyright (c) 2026 Ultra-Dex

/**
 * Governance rules and role definitions
 * Constitutional AI enforcement layer for agent operations
 */

export const ROLE_DEFINITIONS = {
  planner: {
    level: 1,
    description: 'Task breakdown and planning',
    permissions: {
      read: ['docs', 'plan', 'code', 'config'],
      write: ['docs', 'plan'],
      execute: ['ai'],
    },
  },
  cto: {
    level: 3,
    description: 'Architecture and standards',
    permissions: {
      read: ['*'],
      write: ['docs', 'plan', 'config'],
      execute: ['ai'],
    },
  },
  backend: {
    level: 3,
    description: 'API and service implementation',
    permissions: {
      read: ['*'],
      write: ['code', 'config', 'docs', 'tests'],
      execute: ['ai', 'tests'],
    },
  },
  frontend: {
    level: 3,
    description: 'UI implementation',
    permissions: {
      read: ['*'],
      write: ['code', 'docs', 'tests'],
      execute: ['ai', 'tests'],
    },
  },
  database: {
    level: 3,
    description: 'Schema and data layer',
    permissions: {
      read: ['*'],
      write: ['code', 'config', 'docs'],
      execute: ['ai'],
    },
  },
  testing: {
    level: 2,
    description: 'QA and test authoring',
    permissions: {
      read: ['*'],
      write: ['tests', 'docs'],
      execute: ['ai', 'tests'],
    },
  },
  reviewer: {
    level: 1,
    description: 'Code review and audit',
    permissions: {
      read: ['*'],
      write: ['docs'],
      execute: ['ai'],
    },
  },
  debugger: {
    level: 3,
    description: 'Issue triage and fixes',
    permissions: {
      read: ['*'],
      write: ['code', 'tests', 'config', 'docs'],
      execute: ['ai', 'tests', 'shell'],
    },
  },
  devops: {
    level: 4,
    description: 'CI/CD and infrastructure',
    permissions: {
      read: ['*'],
      write: ['config', 'scripts', 'docs'],
      execute: ['ai', 'tests', 'shell'],
    },
  },
  default: {
    level: 0,
    description: 'Unknown agent role (restricted)',
    permissions: {
      read: ['docs', 'plan'],
      write: [],
      execute: ['ai'],
    },
  },
};

export const FILE_TYPE_DEFINITIONS = [
  { id: 'plan', extensions: [], patterns: [/IMPLEMENTATION-PLAN\.md$/i, /CONTEXT\.md$/i] },
  { id: 'docs', extensions: ['.md', '.mdx', '.txt', '.rst'] },
  {
    id: 'tests',
    extensions: [],
    patterns: [/__tests__/, /\/tests?\//, /\.test\./i, /\.spec\./i],
  },
  {
    id: 'code',
    extensions: [
      '.js',
      '.ts',
      '.jsx',
      '.tsx',
      '.mjs',
      '.cjs',
      '.py',
      '.go',
      '.rs',
      '.java',
      '.rb',
      '.php',
      '.cs',
      '.cpp',
      '.c',
      '.h',
      '.swift',
      '.kt',
    ],
  },
  { id: 'config', extensions: ['.json', '.yaml', '.yml', '.toml', '.ini', '.conf', '.config'] },
  { id: 'scripts', extensions: ['.sh', '.bash', '.zsh', '.ps1', '.bat'] },
  { id: 'data', extensions: ['.csv', '.tsv', '.ndjson'] },
  { id: 'shell', extensions: [] },
  { id: 'ai', extensions: [] },
  { id: 'unknown', extensions: [] },
];

export const SENSITIVE_PATH_PATTERNS = [
  /(^|\/)\.env(\.|$)/i,
  /(^|\/)\.env\./i,
  /(^|\/)\.git(\/|$)/i,
  /(^|\/)\.ssh(\/|$)/i,
  /(^|\/)\.aws(\/|$)/i,
  /(^|\/)\.gcp(\/|$)/i,
  /(^|\/)\.azure(\/|$)/i,
  /(^|\/)\.npmrc$/i,
  /(^|\/)\.pypirc$/i,
  /(^|\/)id_rsa(\.|$)/i,
  /(^|\/)credentials?(\/|$)/i,
  /(^|\/)secrets?(\/|$)/i,
  /(^|\/).*\.(pem|key|p12|pfx|crt)$/i,
];

export const FILE_ACCESS_RULES = [
  {
    id: 'protect-git',
    pattern: /(^|\/)\.git(\/|$)/i,
    deny: ['read', 'write', 'execute'],
    reason: 'Git internals are protected',
  },
  {
    id: 'protect-node-modules',
    pattern: /(^|\/)node_modules(\/|$)/i,
    deny: ['write', 'execute'],
    reason: 'Third-party dependencies are immutable',
  },
  {
    id: 'protect-lockfiles',
    pattern: /(package-lock\.json|pnpm-lock\.yaml|yarn\.lock)$/i,
    deny: ['write'],
    reason: 'Lockfiles require manual review',
  },
  {
    id: 'protect-config-audit',
    pattern: /(^|\/)\.ultra-dex(\/|$)/i,
    deny: ['write'],
    reason: 'Governance and audit data is write-protected',
  },
];

export const CONSTITUTIONAL_RULES = [
  {
    id: 'no-path-traversal',
    description: 'Disallow path traversal',
  },
  {
    id: 'stay-in-repo',
    description: 'Disallow operations outside project root',
  },
  {
    id: 'block-sensitive',
    description: 'Block sensitive file access',
  },
  {
    id: 'file-access-control',
    description: 'Enforce file-level access rules',
  },
  {
    id: 'role-permission',
    description: 'Enforce role-based permissions',
  },
  {
    id: 'command-safety',
    description: 'Block destructive shell commands',
  },
];

export const DESTRUCTIVE_COMMAND_PATTERNS = [
  /\brm\s+.*-[a-z]*r[a-z]*f/i, // rm -rf, rm -rf /, rm -rfi
  /\brm\s+.*-[a-z]*f[a-z]*r/i, // rm -fr, rm -fr /
  /\brm\s+.*--recursive/i, // rm --recursive
  /\brm\s+.*--force/i, // rm --force
  /\brm\s+-r\s+-f/i, // rm -r -f
  /\brm\s+-f\s+-r/i, // rm -f -r
  /\bmkfs\b/i, // format filesystem
  /\bdd\s+if=/i, // dd (disk destroyer)
  /\b:\(\)\{.*\|.*&\s*\}\s*;/, // fork bomb
  /\bchmod\s+-R\s+777/i, // open permissions
  /\bchown\s+-R/i, // recursive ownership change on sensitive paths
];

/**
 * Error handler for rules
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    logger.error('[rules]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
