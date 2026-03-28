// Copyright (c) 2026 Ultra-Dex

export const PATTERNS = [
  {
    id: 'fullstack-next',
    name: 'Full-Stack Next.js',
    team: '1-3',
    useCase: 'MVPs, side projects',
    structure: [
      'app/(auth)/login/page.tsx',
      'app/(auth)/signup/page.tsx',
      'app/dashboard/page.tsx',
      'app/api/auth/route.ts',
      'components/',
      'lib/db.ts',
      'prisma/schema.prisma',
    ],
  },
  {
    id: 'separate-monolith',
    name: 'Separate Monolith',
    team: '3-10',
    useCase: 'Growing SaaS',
    structure: [
      'frontend/',
      'backend/src/routes',
      'backend/src/services',
      'backend/src/middleware',
      'backend/prisma',
    ],
  },
  {
    id: 'modular-monolith',
    name: 'Modular Monolith',
    team: '10-50',
    useCase: 'Established products',
    structure: [
      'backend/modules/auth',
      'backend/modules/users',
      'backend/shared',
      'backend/index.ts',
    ],
  },
  {
    id: 'microservices',
    name: 'Microservices',
    team: '50+',
    useCase: 'Large enterprises',
    structure: ['services/auth', 'services/billing', 'services/core', 'gateway/'],
  },
  {
    id: 'serverless',
    name: 'Serverless',
    team: 'Any',
    useCase: 'Variable traffic',
    structure: ['functions/', 'infra/', 'app/'],
  },
];

export function recommendPattern({ teamSize, traffic }) {
  if (traffic === 'spiky') return PATTERNS.find((p) => p.id === 'serverless');
  if (teamSize === '1-3') return PATTERNS.find((p) => p.id === 'fullstack-next');
  if (teamSize === '3-10') return PATTERNS.find((p) => p.id === 'separate-monolith');
  if (teamSize === '10-50') return PATTERNS.find((p) => p.id === 'modular-monolith');
  return PATTERNS.find((p) => p.id === 'microservices');
}

/**
 * Handle errors in decision-tree module
 * @param {Error} error - The error to handle
 * @param {string} [context='decision-tree'] - Error context
 */
function handleModuleError(error, context = 'decision-tree') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
