import Head from 'next/head';
import Link from 'next/link';
import { FiBook, FiCode, FiTerminal, FiDatabase, FiZap, FiShield, FiGlobe, FiUsers, FiCpu, FiGitBranch, FiLock, FiServer, FiBarChart3 } from 'react-icons/fi';

export default function DocsPage() {
  const docSections = [
    {
      title: 'Getting Started',
      icon: <FiTerminal className="h-6 w-6" />,
      items: [
        { name: 'Quick Start', path: '/docs/quickstart', description: 'Get up and running in 5 minutes' },
        { name: 'Installation', path: '/docs/installation', description: 'Install Ultra-Dex in your environment' },
        { name: 'Configuration', path: '/docs/configuration', description: 'Configure your Ultra-Dex instance' },
        { name: 'Hello World', path: '/docs/hello-world', description: 'Your first Ultra-Dex project' }
      ]
    },
    {
      title: 'Core Concepts',
      icon: <FiCpu className="h-6 w-6" />,
      items: [
        { name: 'Agents', path: '/docs/agents', description: 'Learn about specialized AI agents' },
        { name: 'Memory System', path: '/docs/memory', description: 'Hot/Warm/Cold memory architecture' },
        { name: 'Orchestration', path: '/docs/orchestration', description: 'Multi-agent coordination patterns' },
        { name: 'Tools & MCP', path: '/docs/tools', description: 'Model Context Protocol integration' }
      ]
    },
    {
      title: 'AI Providers',
      icon: <FiGlobe className="h-6 w-6" />,
      items: [
        { name: 'OpenAI', path: '/docs/providers/openai', description: 'Integrate with OpenAI models' },
        { name: 'Anthropic', path: '/docs/providers/anthropic', description: 'Use Claude models' },
        { name: 'Google', path: '/docs/providers/google', description: 'Connect to Gemini models' },
        { name: 'Ollama', path: '/docs/providers/ollama', description: 'Self-hosted model support' }
      ]
    },
    {
      title: 'Advanced Features',
      icon: <FiZap className="h-6 w-6" />,
      items: [
        { name: 'Multi-Tenancy', path: '/docs/enterprise/multi-tenancy', description: 'Organization and team management' },
        { name: 'Security', path: '/docs/security', description: 'SSO, RBAC, and compliance' },
        { name: 'Performance', path: '/docs/performance', description: 'Optimization and scaling' },
        { name: 'API Reference', path: '/docs/api', description: 'Programmatic interface documentation' }
      ]
    },
    {
      title: 'Deployment',
      icon: <FiServer className="h-6 w-6" />,
      items: [
        { name: 'Docker', path: '/docs/deployment/docker', description: 'Containerized deployment' },
        { name: 'Kubernetes', path: '/docs/deployment/kubernetes', description: 'K8s deployment guide' },
        { name: 'Enterprise', path: '/docs/deployment/enterprise', description: 'Production deployment' },
        { name: 'Monitoring', path: '/docs/deployment/monitoring', description: 'System monitoring' }
      ]
    },
    {
      title: 'Tutorials',
      icon: <FiBook className="h-6 w-6" />,
      items: [
        { name: 'Build a Chatbot', path: '/docs/tutorials/chatbot', description: 'Create an AI-powered chatbot' },
        { name: 'Multi-Agent Workflow', path: '/docs/tutorials/multi-agent', description: 'Coordinate multiple agents' },
        { name: 'GitHub Automation', path: '/docs/tutorials/github-bot', description: 'Automate GitHub workflows' },
        { name: 'Code Review System', path: '/docs/tutorials/code-review', description: 'AI-powered code review' }
      ]
    }
  ];

  const apiEndpoints = [
    { method: 'GET', path: '/api/v1/agents', description: 'List all available agents' },
    { method: 'POST', path: '/api/v1/agents/:id/execute', description: 'Execute a task with an agent' },
    { method: 'GET', path: '/api/v1/memory/search', description: 'Search memory entries' },
    { method: 'POST', path: '/api/v1/memory/store', description: 'Store a memory entry' },
    { method: 'GET', path: '/api/v1/providers', description: 'List available AI providers' },
    { method: 'POST', path: '/api/v1/tasks', description: 'Create a new task' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Documentation - Ultra-Dex AI Orchestration</title>
        <meta name="description" content="Ultra-Dex documentation and guides" />
      </Head>

      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Ultra-Dex Documentation</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive guides, tutorials, and API references to help you build with Ultra-Dex
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search documentation..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Documentation Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {docSections.map((section, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="text-indigo-600 mr-3">{section.icon}</div>
                  <h2 className="text-lg font-medium text-gray-900">{section.title}</h2>
                </div>
              </div>
              <div className="p-6">
                <ul className="space-y-4">
                  {section.items.map((item, idx) => (
                    <li key={idx}>
                      <Link href={item.path} className="block">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900 hover:text-indigo-600">{item.name}</h3>
                            <p className="mt-1 text-sm text-gray-500">{item.description}</p>
                          </div>
                          <FiArrowRight className="h-4 w-4 text-gray-400 mt-1" />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* API Reference */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-16">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center">
              <FiCode className="h-6 w-6 text-indigo-600 mr-3" />
              <h2 className="text-lg font-medium text-gray-900">API Reference</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Path</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Authentication</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {apiEndpoints.map((endpoint, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          endpoint.method === 'GET' ? 'bg-green-100 text-green-800' :
                          endpoint.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                          endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {endpoint.method}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{endpoint.path}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{endpoint.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {endpoint.path.includes('/webhooks') ? 'Optional' : 'Required'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Start Guide */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Start Guide</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Installation</h3>
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-100">
                <div className="text-green-400"># Install Ultra-Dex CLI</div>
                npm install -g ultra-dex
                <div className="mt-2 text-green-400"># Initialize a new project</div>
                ultra-dex init
                <div className="mt-2 text-green-400"># Configure your AI providers</div>
                ultra-dex config --wizard
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Usage</h3>
              <div className="bg-gray-900 rounded-lg p-4 font-mono text-sm text-gray-100">
                <div className="text-green-400"># Run a simple task</div>
                ultra-dex run --task "Create a simple Express server"
                <div className="mt-2 text-green-400"># Start the dashboard</div>
                ultra-dex serve
                <div className="mt-2 text-green-400"># Interact with agents</div>
                ultra-dex swarm --task "Build a feature"
              </div>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Help?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Our documentation covers everything you need to get started, but if you need additional help,
            our community and support team are here for you.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/community" className="bg-white text-gray-900 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 font-medium">
              Join Community
            </Link>
            <Link href="/support" className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 font-medium">
              Contact Support
            </Link>
            <Link href="/tutorials" className="bg-white text-gray-900 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 font-medium">
              View Tutorials
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}