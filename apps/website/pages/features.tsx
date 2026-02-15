import Head from 'next/head';
import Link from 'next/link';

export default function Features() {
  const features = [
    {
      title: 'Persistent Memory',
      description: 'Never lose context between AI sessions. Store and retrieve information across multiple interactions.',
      icon: '🧠',
      details: [
        'Triple-store architecture (SQLite + Vector + Graph)',
        'Vector similarity search',
        'Graph relationship mapping',
        'Memory retention across sessions',
        'Context persistence for agents'
      ]
    },
    {
      title: 'Multi-Agent Orchestration',
      description: 'Coordinate multiple AI agents to work together on complex tasks with seamless handoffs.',
      icon: '🔄',
      details: [
        '18 specialized agents',
        'Automatic task delegation',
        'Visual workflow builder',
        'Intelligent handoff protocols',
        'Agent collaboration patterns'
      ]
    },
    {
      title: 'Smart Routing',
      description: 'Automatically route requests to the best AI provider based on cost, latency, and quality.',
      icon: '⚡',
      details: [
        '15+ AI providers supported',
        'Cost optimization algorithms',
        'Latency-based routing',
        'Quality scoring system',
        'Fallback mechanisms'
      ]
    },
    {
      title: 'Enterprise Security',
      description: 'Built-in security features to protect your data and AI workflows.',
      icon: '🛡️',
      details: [
        'SOC 2 compliant architecture',
        'SSO/SAML integration',
        'Role-based access control',
        'End-to-end encryption',
        'Audit logging'
      ]
    },
    {
      title: 'Real-time Analytics',
      description: 'Monitor your AI workflows with comprehensive analytics and insights.',
      icon: '📊',
      details: [
        'Cost tracking and budget alerts',
        'Performance metrics',
        'Usage analytics',
        'Provider comparison',
        'ROI measurement'
      ]
    },
    {
      title: 'Extensive Integrations',
      description: 'Connect with your existing tools and workflows seamlessly.',
      icon: '🔌',
      details: [
        'GitHub Actions integration',
        'VS Code Extension',
        'API & SDK support',
        'CI/CD pipeline integration',
        'Third-party tool connectors'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <Head>
        <title>Ultra-Dex Features | Powerful AI Orchestration</title>
        <meta name="description" content="Explore Ultra-Dex's powerful features for AI orchestration, persistent memory, and multi-agent workflows." />
        <meta name="keywords" content="AI orchestration features, persistent memory, multi-agent system, smart routing" />
        <link rel="canonical" href="https://ultra-dex.dev/features" />
      </Head>

      <section className="py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Powerful <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Features</span> for Production AI
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Everything you need to build production-ready AI applications with confidence and scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-8 hover:border-blue-500/50 transition-all"
              >
                <div className="text-4xl mb-6">{feature.icon}</div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-400 mb-6">{feature.description}</p>
                <ul className="space-y-3">
                  {feature.details.map((detail, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-green-500 mr-2 mt-1">✓</span>
                      <span className="text-gray-300">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-20 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-2xl p-12 border border-gray-700">
            <h2 className="text-3xl font-bold mb-6 text-center">Why Choose Ultra-Dex?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-xl font-bold mb-2">Production Ready</h3>
                <p className="text-gray-400">Built from day one for production use with enterprise-grade security, reliability, and scalability.</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">💡</div>
                <h3 className="text-xl font-bold mb-2">Developer Delight</h3>
                <p className="text-gray-400">Obsessed over the developer experience with beautiful UIs, delightful CLI, and comprehensive documentation.</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🌐</div>
                <h3 className="text-xl font-bold mb-2">Open by Design</h3>
                <p className="text-gray-400">Works with any AI model, any tool, and any workflow. No vendor lock-in, full interoperability.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}