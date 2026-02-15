export interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  description: string;
  cta: string;
  highlighted?: boolean;
  features: string[];
}

export interface Feature {
  title: string;
  description: string;
}

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readTime: string;
  tags: string[];
}

export const siteName = 'Ultra-Dex';

export const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/docs', label: 'Docs' },
  { href: '/blog', label: 'Blog' },
  { href: '/enterprise', label: 'Enterprise' },
  { href: '/contact', label: 'Contact' },
];

export const coreFeatures: Feature[] = [
  {
    title: 'Multi-Agent Orchestration',
    description:
      'Coordinate planner, implementation, review, and ops agents in a single execution loop.',
  },
  {
    title: 'Unified Memory Layer',
    description:
      'Persist context across sessions with hot, warm, and cold memory strategies.',
  },
  {
    title: 'Provider Routing',
    description:
      'Route intelligently between OpenAI, Anthropic, Google, and local models with fallback.',
  },
  {
    title: 'Enterprise Controls',
    description:
      'SSO, RBAC, auditability, and governance hooks for secure team operations.',
  },
  {
    title: 'Realtime Dashboard',
    description:
      'Track agent health, cost, logs, and memory behavior in one operational console.',
  },
  {
    title: 'Git Workflow Tooling',
    description:
      'Analyze repository velocity, suggest commits, and keep release operations safe by default.',
  },
];

export const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    description: 'For individual builders and early exploration.',
    cta: 'Get Started',
    features: [
      '1 agent',
      '100 requests/month',
      'Core memory features',
      'Community support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 49,
    description: 'For serious solo builders and small teams.',
    cta: 'Start Trial',
    highlighted: true,
    features: [
      '10 agents',
      'Unlimited requests',
      'Advanced memory controls',
      'Priority support',
      'CI integration templates',
    ],
  },
  {
    id: 'team',
    name: 'Team',
    priceMonthly: 199,
    description: 'For product teams running agentic workflows daily.',
    cta: 'Start Team Trial',
    features: [
      '50 agents',
      'Team RBAC',
      'Cost analytics',
      'Integration support',
      'Operational playbooks',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 999,
    description: 'For regulated environments and scale operations.',
    cta: 'Contact Sales',
    features: [
      'Unlimited agents',
      'SSO/SAML',
      'Audit and compliance controls',
      'Dedicated support',
      'Private deployment options',
    ],
  },
];

export const blogPosts: Post[] = [
  {
    slug: 'memory-crisis-in-ai-development',
    title: 'Why We Built Ultra-Dex: The Memory Crisis in AI Development',
    excerpt:
      'Context loss between sessions is still the hidden tax in AI-native engineering teams. We break down the root causes and system design response.',
    date: '2026-02-10',
    category: 'Founding',
    readTime: '8 min',
    tags: ['memory', 'architecture', 'ai-systems'],
  },
  {
    slug: 'ultra-dex-vs-langchain',
    title: 'Ultra-Dex vs LangChain: Where Each Fits Best',
    excerpt:
      'A practical comparison with clear trade-offs across orchestration, developer velocity, and operations.',
    date: '2026-02-08',
    category: 'Comparison',
    readTime: '10 min',
    tags: ['comparison', 'langchain', 'orchestration'],
  },
  {
    slug: 'production-ai-agent-lessons',
    title: 'Building Production AI Agents: Lessons From Real Deployments',
    excerpt:
      'What breaks first in production, and the guardrails that keep incident rate low.',
    date: '2026-02-05',
    category: 'Engineering',
    readTime: '9 min',
    tags: ['production', 'reliability', 'agents'],
  },
  {
    slug: 'cost-optimization-routing',
    title: 'How Smart Routing Reduced AI Spend by 60%',
    excerpt:
      'Cost control requires policy plus runtime routing. Here is the implementation pattern we use.',
    date: '2026-02-03',
    category: 'Optimization',
    readTime: '7 min',
    tags: ['cost', 'routing', 'finops'],
  },
  {
    slug: 'future-of-ai-orchestration',
    title: 'The Future of AI Orchestration: Composable Control Planes',
    excerpt:
      'Where orchestration is heading and what enterprise teams should prepare for now.',
    date: '2026-02-01',
    category: 'Vision',
    readTime: '6 min',
    tags: ['vision', 'platform', 'enterprise'],
  },
];
