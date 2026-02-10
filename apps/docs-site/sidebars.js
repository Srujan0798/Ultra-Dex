// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/installation',
        'getting-started/quick-start',
        'getting-started/configuration'
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/system-overview',
        'architecture/system-diagram',
        'architecture/00-STRATEGIC-ROADMAP',
        'architecture/01-persistent-memory',
        'architecture/02-model-router',
        'architecture/03-quality-gates',
        'architecture/04-decision-ledger',
        'architecture/05-mcp-context-bus',
        'architecture/META-LAYER',
        'architecture/MULTI-TENANCY',
        'architecture/RULES-MARKETPLACE',
        'architecture/ULTRA-DEX-OS'
      ],
    },
    {
      type: 'category',
      label: 'CLI Reference',
      items: [
        'api/cli-reference',
        'api/generated-cli-reference',
        'api/cli-overview'
      ],
    },
    {
      type: 'category',
      label: 'Integrations',
      items: [
        'api/integrations',
        'api/github-integration',
        'api/stripe-integration'
      ],
    },
    {
      type: 'category',
      label: 'Agent Guide',
      items: [
        'agents/overview',
        'agents/list',
        'agents/custom',
        'agents/orchestration'
      ],
    },
    {
      type: 'category',
      label: 'MCP Integration',
      items: [
        'mcp/overview',
        'mcp/setup',
        'mcp/providers',
        'mcp/troubleshooting'
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: [
        'guides/context-management',
        'guides/planning-workflows',
        'guides/verification-process',
        'guides/team-collaboration'
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: [
        'api/overview',
        'api/endpoints',
        'api/authentication'
      ],
    },
    'troubleshooting',
    'faq',
  ],
};

export default sidebars;

/**
 * Error handler for sidebars
 * @param {Error} error - Error to handle
 */
function handleSidebarsError(error) {
  try {
    console.error('[sidebars]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
