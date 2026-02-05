// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: ['getting-started/installation', 'getting-started/quick-start', 'getting-started/configuration'],
    },
    {
      type: 'category',
      label: 'CLI Reference',
      items: ['cli/overview', 'cli/init', 'cli/generate', 'cli/serve', 'cli/swarm', 'cli/plan'],
    },
    {
      type: 'category',
      label: 'Agent Guide',
      items: ['agents/overview', 'agents/list', 'agents/custom', 'agents/orchestration'],
    },
    {
      type: 'category',
      label: 'MCP Integration',
      items: ['mcp/overview', 'mcp/setup', 'mcp/providers', 'mcp/troubleshooting'],
    },
    {
      type: 'category',
      label: 'VS Code Extension',
      items: ['vscode/overview', 'vscode/installation', 'vscode/features', 'vscode/configuration'],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: ['api/overview', 'api/endpoints', 'api/authentication'],
    },
    'troubleshooting',
    'faq',
  ],
};

export default sidebars;