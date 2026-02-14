import Head from 'next/head';
import Link from 'next/link';
import { FiZap, FiShield, FiDatabase, FiGlobe, FiUsers, FiGitBranch, FiCode, FiBarChart3, FiClock, FiCpu, FiLayers, FiTerminal, FiCheck, FiArrowRight } from 'react-icons/fi';

export default function FeaturesPage() {
  const features = [
    {
      icon: <FiZap className="h-8 w-8" />,
      title: 'Multi-Agent Orchestration',
      description: 'Coordinate specialized AI agents with autonomous task delegation and verification',
      details: [
        'Planner, CTO, Backend, Frontend, Security agents',
        'Automatic task decomposition and assignment',
        'Cross-agent communication and coordination',
        'Verification and quality assurance workflows'
      ]
    },
    {
      icon: <FiShield className="h-8 w-8" />,
      title: 'Enterprise Security',
      description: 'SSO, MFA, RBAC, audit logging, and encryption at rest/in transit',
      details: [
        'SAML 2.0 and OIDC Single Sign-On',
        'Multi-factor authentication',
        'Role-based access control',
        'Immutable audit logs',
        'End-to-end encryption'
      ]
    },
    {
      icon: <FiDatabase className="h-8 w-8" />,
      title: 'Tiered Memory System',
      description: 'Hot/Warm/Cold memory architecture with intelligent caching',
      details: [
        'Hot memory for frequently accessed data',
        'Warm memory for moderately accessed data',
        'Cold memory for archival data',
        'Automatic tiering based on access patterns',
        'Persistent storage with search capabilities'
      ]
    },
    {
      icon: <FiGlobe className="h-8 w-8" />,
      title: 'Multi-Provider Support',
      description: 'Connect to OpenAI, Anthropic, Google, Ollama, and custom providers',
      details: [
        'Unified interface for all AI providers',
        'Automatic provider selection based on task',
        'Cost optimization across providers',
        'Fallback mechanisms for reliability',
        'Custom provider integration'
      ]
    },
    {
      icon: <FiUsers className="h-8 w-8" />,
      title: 'Multi-Tenancy',
      description: 'Complete resource isolation between organizations and teams',
      details: [
        'Organization workspaces',
        'Team management and permissions',
        'Resource quotas and limits',
        'Billing per organization',
        'Admin controls and governance'
      ]
    },
    {
      icon: <FiGitBranch className="h-8 w-8" />,
      title: 'MCP Integration',
      description: 'Model Context Protocol for tool integration and extensibility',
      details: [
        'Standardized tool interface',
        'Extensible tool ecosystem',
        'IDE integration (Cursor, Claude)',
        'Custom tool development',
        'Secure tool execution'
      ]
    },
    {
      icon: <FiCode className="h-8 w-8" />,
      title: 'Visual Debugging',
      description: 'Real-time execution flow visualization with click-to-inspect capabilities',
      details: [
        'Execution flow visualization',
        'Step-by-step inspection',
        'Performance metrics',
        'Error tracking and resolution',
        'Interactive debugging tools'
      ]
    },
    {
      icon: <FiBarChart3 className="h-8 w-8" />,
      title: 'Advanced Analytics',
      description: 'Comprehensive monitoring, metrics, and performance insights',
      details: [
        'Real-time system monitoring',
        'Usage and cost tracking',
        'Performance analytics',
        'Agent productivity metrics',
        'Business intelligence dashboards'
      ]
    }
  ];

  const aiProviders = [
    { name: 'OpenAI', models: ['gpt-4o-2024-11-20', 'gpt-4o-mini', 'o1-preview', 'o1-mini'] },
    { name: 'Anthropic', models: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-opus', 'claude-sonnet'] },
    { name: 'Google', models: ['gemini-2.0-flash-exp', 'gemini-1.5-pro', 'gemini-1.5-flash'] },
    { name: 'Ollama', models: ['llama3.2', 'mistral-nemo', 'qwen2.5', 'gemma2'] },
    { name: 'Azure OpenAI', models: ['gpt-4o', 'gpt-4', 'dalle-3'] },
    { name: 'AWS Bedrock', models: ['claude-3-sonnet', 'llama3.1', 'command-r'] }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Features - Ultra-Dex AI Orchestration</title>
        <meta name="description" content="Advanced features of Ultra-Dex AI orchestration platform" />
      </Head>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Powerful Features for <span className="text-indigo-200">Enterprise AI</span>
            </h1>
            <p className="text-xl text-indigo-100 max-w-3xl mx-auto">
              Ultra-Dex provides the most comprehensive AI orchestration platform with enterprise-grade security, 
              scalability, and developer experience.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Core Capabilities</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to build, deploy, and scale AI-powered applications with confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
                <div className="text-indigo-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start">
                      <FiCheck className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Providers Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">AI Provider Ecosystem</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Connect to any AI provider with a unified interface and automatic optimization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {aiProviders.map((provider, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{provider.name}</h3>
                <div className="space-y-2">
                  {provider.models.map((model, idx) => (
                    <div key={idx} className="flex items-center text-sm text-gray-700">
                      <FiArrowRight className="h-4 w-4 text-indigo-500 mr-2 flex-shrink-0" />
                      <span>{model}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Architecture Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Architecture Overview</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Designed for performance, scalability, and security from the ground up.
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">System Components</h3>
                <div className="space-y-6">
                  <div className="flex">
                    <div className="mr-4">
                      <div className="bg-indigo-100 w-10 h-10 rounded-lg flex items-center justify-center">
                        <FiCpu className="h-5 w-5 text-indigo-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Agent Orchestrator</h4>
                      <p className="text-gray-600 mt-1">Coordinates specialized AI agents with task decomposition and verification</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="mr-4">
                      <div className="bg-indigo-100 w-10 h-10 rounded-lg flex items-center justify-center">
                        <FiDatabase className="h-5 w-5 text-indigo-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Memory Manager</h4>
                      <p className="text-gray-600 mt-1">Tiered memory system with hot/warm/cold storage and intelligent caching</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="mr-4">
                      <div className="bg-indigo-100 w-10 h-10 rounded-lg flex items-center justify-center">
                        <FiGlobe className="h-5 w-5 text-indigo-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">MCP Server</h4>
                      <p className="text-gray-600 mt-1">Model Context Protocol for secure tool integration and extensibility</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="mr-4">
                      <div className="bg-indigo-100 w-10 h-10 rounded-lg flex items-center justify-center">
                        <FiShield className="h-5 w-5 text-indigo-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Security Layer</h4>
                      <p className="text-gray-600 mt-1">Enterprise-grade authentication, authorization, and compliance controls</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6">Performance & Scalability</h3>
                <div className="space-y-6">
                  <div className="flex">
                    <div className="mr-4">
                      <div className="bg-indigo-100 w-10 h-10 rounded-lg flex items-center justify-center">
                        <FiBarChart3 className="h-5 w-5 text-indigo-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Real-time Monitoring</h4>
                      <p className="text-gray-600 mt-1">Comprehensive metrics and observability for all system components</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="mr-4">
                      <div className="bg-indigo-100 w-10 h-10 rounded-lg flex items-center justify-center">
                        <FiLayers className="h-5 w-5 text-indigo-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Horizontal Scaling</h4>
                      <p className="text-gray-600 mt-1">Distributed architecture that scales with your needs</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="mr-4">
                      <div className="bg-indigo-100 w-10 h-10 rounded-lg flex items-center justify-center">
                        <FiClock className="h-5 w-5 text-indigo-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Caching Layer</h4>
                      <p className="text-gray-600 mt-1">Intelligent caching with TTL and size limits for optimal performance</p>
                    </div>
                  </div>
                  
                  <div className="flex">
                    <div className="mr-4">
                      <div className="bg-indigo-100 w-10 h-10 rounded-lg flex items-center justify-center">
                        <FiTerminal className="h-5 w-5 text-indigo-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Sandbox Environment</h4>
                      <p className="text-gray-600 mt-1">Secure execution environment with resource limits and network isolation</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-indigo-600 to-purple-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your AI Development?</h2>
          <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-8">
            Join thousands of developers building the future with Ultra-Dex.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/signup" className="bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-100 flex items-center justify-center">
              Get Started Free
            </Link>
            <Link href="/demo" className="bg-indigo-800 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-indigo-900 flex items-center justify-center">
              Watch Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}