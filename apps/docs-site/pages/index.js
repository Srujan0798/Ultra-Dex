import React from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Head>
        <title>Ultra-Dex Documentation</title>
        <meta name="description" content="Official documentation for Ultra-Dex AI Orchestration Platform" />
      </Head>

      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-purple-700 mb-4">Ultra-Dex Documentation</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          The AI Orchestration Meta-Layer for SaaS Development - Complete Guide
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Getting Started</h2>
          <p className="text-gray-600 mb-4">Learn how to install and set up Ultra-Dex in your environment.</p>
          <Link href="/getting-started" className="text-blue-600 hover:underline font-medium">
            Start Tutorial →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Core Concepts</h2>
          <p className="text-gray-600 mb-4">Understand the fundamental concepts of AI orchestration.</p>
          <Link href="/concepts/agents" className="text-green-600 hover:underline font-medium">
            Learn Concepts →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">API Reference</h2>
          <p className="text-gray-600 mb-4">Detailed API documentation for developers.</p>
          <Link href="/api-reference" className="text-purple-600 hover:underline font-medium">
            View API →
          </Link>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Featured Tutorials</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-lg mb-2">Building Your First Agent</h3>
            <p className="text-gray-600 mb-3">Step-by-step guide to creating your first specialized agent.</p>
            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">Beginner</span>
          </div>
          <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-lg mb-2">Multi-Agent Workflows</h3>
            <p className="text-gray-600 mb-3">Orchestrate complex workflows with multiple agents.</p>
            <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Intermediate</span>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-4">Need Help?</h2>
        <p className="mb-6 max-w-lg">
          Join our community of developers and AI engineers building with Ultra-Dex.
        </p>
        <div className="flex flex-wrap gap-4">
          <button className="bg-white text-purple-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors">
            Join Discord
          </button>
          <button className="bg-transparent border-2 border-white px-6 py-2 rounded-lg font-medium hover:bg-white/10 transition-colors">
            GitHub Discussions
          </button>
        </div>
      </section>
    </div>
  );
}