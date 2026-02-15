import Head from 'next/head';
import Link from 'next/link';

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <Head>
        <title>About Ultra-Dex | AI Orchestration Platform</title>
        <meta name="description" content="Learn about Ultra-Dex and our mission to solve the AI memory crisis" />
        <meta name="keywords" content="about Ultra-Dex, AI orchestration company, persistent memory" />
        <link rel="canonical" href="https://ultra-dex.dev/about" />
      </Head>

      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Ultra-Dex</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              The AI orchestration meta-layer for production software delivery
            </p>
          </div>

          <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-8 mb-12">
            <h2 className="text-3xl font-bold mb-6 text-blue-400">Our Mission</h2>
            <p className="text-gray-300 text-lg mb-6">
              At Ultra-Dex, we believe that the future of AI development lies not in single models or tools, 
              but in the orchestration of multiple AI agents working together with persistent memory and 
              intelligent routing.
            </p>
            <p className="text-gray-300 text-lg mb-6">
              Our platform solves the critical problem of context loss in AI interactions, enabling 
              developers to build production-ready AI applications that maintain state, learn from 
              past interactions, and coordinate complex workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 p-8 rounded-2xl border border-blue-700/30">
              <h3 className="text-2xl font-bold mb-4 text-blue-400">The Problem</h3>
              <p className="text-gray-300">
                Traditional AI tools suffer from "amnesia" - each session starts fresh with no memory 
                of previous interactions. This leads to fragmented workflows, repeated context setting, 
                and inability to build complex, multi-step applications.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 p-8 rounded-2xl border border-purple-700/30">
              <h3 className="text-2xl font-bold mb-4 text-purple-400">Our Solution</h3>
              <p className="text-gray-300">
                Ultra-Dex provides a persistent memory layer that connects all AI interactions, 
                enabling multi-agent coordination, intelligent routing, and production-ready 
                orchestration for complex AI workflows.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-8 mb-12">
            <h2 className="text-3xl font-bold mb-6 text-purple-400">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-xl font-bold mb-2">Production First</h3>
                <p className="text-gray-400">
                  Built from day one for production use with enterprise-grade security, 
                  reliability, and scalability.
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-4xl mb-4">💡</div>
                <h3 className="text-xl font-bold mb-2">Developer Delight</h3>
                <p className="text-gray-400">
                  We obsess over the developer experience with beautiful UIs, 
                  delightful CLI experiences, and comprehensive documentation.
                </p>
              </div>
              
              <div className="text-center">
                <div className="text-4xl mb-4">🌐</div>
                <h3 className="text-xl font-bold mb-2">Open by Design</h3>
                <p className="text-gray-400">
                  We believe in open standards and interoperability. Our platform works with 
                  any AI model, any tool, and any workflow.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl border border-gray-700 p-8">
            <h2 className="text-3xl font-bold mb-6 text-green-400">Our Technology</h2>
            <div className="space-y-6">
              <div className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-900/20 p-4 rounded-r-lg">
                <h3 className="text-xl font-bold mb-2">Triple-Store Architecture</h3>
                <p className="text-gray-300">
                  We combine SQLite for structured data, vector databases for semantic search, 
                  and graph databases for relationship mapping to create a comprehensive memory system.
                </p>
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4 py-2 bg-gray-900/20 p-4 rounded-r-lg">
                <h3 className="text-xl font-bold mb-2">Multi-Agent Orchestration</h3>
                <p className="text-gray-300">
                  Coordinate multiple specialized AI agents to work together on complex tasks 
                  with seamless handoffs and intelligent task delegation.
                </p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4 py-2 bg-gray-900/20 p-4 rounded-r-lg">
                <h3 className="text-xl font-bold mb-2">Smart Routing</h3>
                <p className="text-gray-300">
                  Automatically route requests to the best AI provider based on cost, latency, 
                  and quality with built-in fallback mechanisms.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}