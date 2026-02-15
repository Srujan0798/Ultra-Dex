import Head from 'next/head';
import Link from 'next/link';

export default function Docs() {
  const categories = [
    {
      title: 'Getting Started',
      items: [
        { name: 'Quick Start', href: '/docs/quickstart', description: 'Get up and running in 5 minutes' },
        { name: 'Installation', href: '/docs/installation', description: 'Install Ultra-Dex globally or use npx' },
        { name: 'Configuration', href: '/docs/configuration', description: 'Configure your API keys and settings' },
        { name: 'First Agent', href: '/docs/first-agent', description: 'Create your first AI agent' }
      ]
    },
    {
      title: 'Core Concepts',
      items: [
        { name: 'Persistent Memory', href: '/docs/memory', description: 'How Ultra-Dex stores and retrieves context' },
        { name: 'Agent Orchestration', href: '/docs/agents', description: 'Coordinate multiple AI agents' },
        { name: 'Smart Routing', href: '/docs/routing', description: 'Automatic provider selection' },
        { name: 'MCP Integration', href: '/docs/mcp', description: 'Model Context Protocol integration' }
      ]
    },
    {
      title: 'CLI Guide',
      items: [
        { name: 'Commands Overview', href: '/docs/cli/commands', description: 'All 152 CLI commands' },
        { name: 'Initialization', href: '/docs/cli/init', description: 'Initialize a new project' },
        { name: 'Swarm Execution', href: '/docs/cli/swarm', description: 'Run multi-agent workflows' },
        { name: 'Git Integration', href: '/docs/cli/git', description: 'Git workflow commands' }
      ]
    },
    {
      title: 'API Reference',
      items: [
        { name: 'REST API', href: '/docs/api/rest', description: 'HTTP endpoints for all functionality' },
        { name: 'WebSocket API', href: '/docs/api/websocket', description: 'Real-time event streaming' },
        { name: 'JavaScript SDK', href: '/docs/api/javascript', description: 'Client library for JavaScript' },
        { name: 'Python SDK', href: '/docs/api/python', description: 'Client library for Python' }
      ]
    },
    {
      title: 'Integrations',
      items: [
        { name: 'GitHub Actions', href: '/docs/integrations/github', description: 'CI/CD integration' },
        { name: 'VS Code Extension', href: '/docs/integrations/vscode', description: 'IDE integration' },
        { name: 'Slack Bot', href: '/docs/integrations/slack', description: 'Team collaboration' },
        { name: 'Custom Integrations', href: '/docs/integrations/custom', description: 'Build your own' }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <Head>
        <title>Ultra-Dex Documentation | Complete Guide</title>
        <meta name="description" content="Complete documentation for Ultra-Dex AI orchestration platform" />
        <meta name="keywords" content="Ultra-Dex documentation, AI orchestration docs, multi-agent system docs" />
        <link rel="canonical" href="https://ultra-dex.dev/docs" />
      </Head>

      <section className="py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Documentation
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Comprehensive guides, tutorials, and references to help you build with Ultra-Dex.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 sticky top-6">
                <h2 className="text-xl font-bold mb-6 text-blue-400">Table of Contents</h2>
                <nav className="space-y-2">
                  {categories.map((category, index) => (
                    <div key={index}>
                      <h3 className="font-semibold text-gray-300 mb-2">{category.title}</h3>
                      <ul className="space-y-1 ml-2">
                        {category.items.map((item, idx) => (
                          <li key={idx}>
                            <a 
                              href={item.href} 
                              className="block py-2 px-3 rounded-lg hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white"
                            >
                              {item.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
                <h2 className="text-3xl font-bold mb-6 text-blue-400">Getting Started</h2>
                <p className="text-gray-300 mb-8">
                  Welcome to Ultra-Dex! This guide will help you get up and running quickly with our AI orchestration platform.
                </p>

                <div className="bg-gray-900/50 rounded-xl p-6 mb-8">
                  <h3 className="text-xl font-bold mb-4">Quick Start</h3>
                  <p className="text-gray-300 mb-4">Install Ultra-Dex globally and initialize your first project:</p>
                  <pre className="bg-gray-800 p-4 rounded-lg text-sm overflow-x-auto">
                    <code className="text-gray-300">
                      {`# Install Ultra-Dex globally
npm install -g ultra-dex

# Initialize a new project
ultra-dex init

# Run your first agent swarm
ultra-dex swarm "Build a simple calculator app"

# View the dashboard
ultra-dex dashboard`}
                    </code>
                  </pre>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 p-6 rounded-xl border border-blue-700/30">
                    <h3 className="text-lg font-bold mb-2">Prerequisites</h3>
                    <ul className="text-gray-300 space-y-2">
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Node.js 18+</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>npm or yarn</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>Git (for version control)</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 p-6 rounded-xl border border-purple-700/30">
                    <h3 className="text-lg font-bold mb-2">Required Keys</h3>
                    <ul className="text-gray-300 space-y-2">
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>ANTHROPIC_API_KEY</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>OPENAI_API_KEY</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span>GOOGLE_AI_KEY</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-4 mt-12">Core Concepts</h3>
                <p className="text-gray-300 mb-6">
                  Understanding the core concepts of Ultra-Dex will help you build more effective AI workflows.
                </p>

                <div className="space-y-6">
                  <div className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-900/20 p-4 rounded-r-lg">
                    <h4 className="text-lg font-bold mb-2">Persistent Memory</h4>
                    <p className="text-gray-300">
                      Ultra-Dex maintains a persistent memory layer that allows AI agents to remember context across sessions. 
                      This includes a triple-store architecture with SQLite for structured data, vector databases for semantic 
                      search, and graph databases for relationship mapping.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-purple-500 pl-4 py-2 bg-gray-900/20 p-4 rounded-r-lg">
                    <h4 className="text-lg font-bold mb-2">Agent Orchestration</h4>
                    <p className="text-gray-300">
                      Coordinate multiple specialized AI agents to work together on complex tasks. Each agent has a specific 
                      role and can hand off work to other agents seamlessly. The system manages dependencies and ensures 
                      proper execution order.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-4 py-2 bg-gray-900/20 p-4 rounded-r-lg">
                    <h4 className="text-lg font-bold mb-2">Smart Routing</h4>
                    <p className="text-gray-300">
                      Automatically route requests to the best AI provider based on cost, latency, and quality. The system 
                      includes fallback mechanisms and load balancing to ensure optimal performance and reliability.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}