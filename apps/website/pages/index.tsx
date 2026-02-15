import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white">
      <Head>
        <title>Ultra-Dex - AI Orchestration Meta-Layer</title>
        <meta name="description" content="The Memory Layer for AI-Native Development" />
        <meta name="keywords" content="AI orchestration, AI agents, memory layer, multi-agent system" />
        <meta property="og:title" content="Ultra-Dex - AI Orchestration Meta-Layer" />
        <meta property="og:description" content="The Memory Layer for AI-Native Development" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://ultra-dex.dev" />
      </Head>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-block px-4 py-1 mb-6 bg-blue-500/20 rounded-full text-sm font-semibold border border-blue-500/30">
            <span className="mr-2">🎉</span> Now Generally Available
          </div>
          <h1 className="text-4xl md:text-7xl font-bold mb-6 leading-tight">
            The <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">AI Orchestration</span> Meta-Layer
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
            Connect any model. Persist any context. Orchestrate any workflow. The memory layer that transforms fragmented AI tools into cohesive, production-ready systems.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/get-started" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg">
              Get Started Free
            </Link>
            <Link href="/demo" className="px-8 py-4 bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm rounded-lg font-semibold text-lg transition-all border border-gray-700">
              Watch Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-black/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400">211K+</div>
              <div className="text-gray-400 mt-2">Lines of Code</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">31</div>
              <div className="text-gray-400 mt-2">Core Modules</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-400">152</div>
              <div className="text-gray-400 mt-2">CLI Commands</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-400">18</div>
              <div className="text-gray-400 mt-2">Specialized Agents</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Powerful Features for Production AI</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl border border-gray-700/50 hover:border-blue-500/50 transition-all">
              <div className="text-blue-400 text-4xl mb-4">🧠</div>
              <h3 className="text-2xl font-bold mb-3">Persistent Memory</h3>
              <p className="text-gray-400 mb-4">
                Never lose context between AI sessions. Our triple-store architecture with SQLite, vector databases, and graph databases ensures continuity across all interactions.
              </p>
              <ul className="text-gray-300 space-y-2">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Triple-store architecture</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Vector similarity search</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Graph relationship mapping</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl border border-gray-700/50 hover:border-purple-500/50 transition-all">
              <div className="text-purple-400 text-4xl mb-4">🔄</div>
              <h3 className="text-2xl font-bold mb-3">Multi-Agent Orchestration</h3>
              <p className="text-gray-400 mb-4">
                Coordinate multiple specialized AI agents to work together on complex tasks with seamless handoffs and intelligent task delegation.
              </p>
              <ul className="text-gray-300 space-y-2">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>18 specialized agents</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Automatic task delegation</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Visual workflow builder</span>
                </li>
              </ul>
            </div>
            <div className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-xl border border-gray-700/50 hover:border-green-500/50 transition-all">
              <div className="text-green-400 text-4xl mb-4">⚡</div>
              <h3 className="text-2xl font-bold mb-3">Smart Routing</h3>
              <p className="text-gray-400 mb-4">
                Automatically route requests to the best AI provider based on cost, latency, and quality with built-in fallback mechanisms.
              </p>
              <ul className="text-gray-300 space-y-2">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>15+ AI providers</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Fallback mechanisms</span>
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Cost optimization</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your AI Workflow?</h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
            Join thousands of developers who are building the future of AI-native applications with Ultra-Dex.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/get-started" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold text-lg transition-all transform hover:scale-105 shadow-lg">
              Start Free Trial
            </Link>
            <Link href="/contact" className="px-8 py-4 bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm rounded-lg font-semibold text-lg transition-all border border-gray-700">
              Contact Sales
            </Link>
          </div>
          <p className="text-gray-500 mt-6 text-sm">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
}