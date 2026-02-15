import Head from 'next/head';
import Link from 'next/link';

export default function Enterprise() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <Head>
        <title>Ultra-Dex for Enterprise | Production AI Orchestration</title>
        <meta name="description" content="Enterprise-grade AI orchestration with security, compliance, and scalability for large organizations" />
        <meta name="keywords" content="enterprise AI orchestration, AI security, AI compliance, scalable AI" />
        <link rel="canonical" href="https://ultra-dex.dev/enterprise" />
      </Head>

      <section className="py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                Enterprise Solutions
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Production-ready AI orchestration with enterprise-grade security, 
              compliance, and scalability for your organization.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
            <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/10 p-8 rounded-2xl border border-blue-700/30">
              <h2 className="text-3xl font-bold mb-6 text-blue-400">Enterprise Security</h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <span className="text-lg"><strong>SOC 2 Type II Compliant:</strong> Enterprise-grade security and compliance</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <span className="text-lg"><strong>SSO/SAML Integration:</strong> Seamless authentication with your identity provider</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <span className="text-lg"><strong>Role-Based Access Control:</strong> Fine-grained permissions for your teams</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <span className="text-lg"><strong>Data Encryption:</strong> End-to-end encryption at rest and in transit</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <span className="text-lg"><strong>Audit Logs:</strong> Comprehensive logging for compliance requirements</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 p-8 rounded-2xl border border-purple-700/30">
              <h2 className="text-3xl font-bold mb-6 text-purple-400">Scale & Performance</h2>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <span className="text-lg"><strong>Horizontal Scaling:</strong> Scale to thousands of concurrent agents</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <span className="text-lg"><strong>High Availability:</strong> 99.99% uptime SLA guaranteed</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <span className="text-lg"><strong>Performance Optimization:</strong> Sub-200ms response times at scale</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <span className="text-lg"><strong>Resource Management:</strong> Intelligent load balancing and resource allocation</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-3 mt-1">✓</span>
                  <span className="text-lg"><strong>Disaster Recovery:</strong> Multi-region failover capabilities</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mb-20">
            <h2 className="text-4xl font-bold text-center mb-16">Enterprise Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-xl border border-gray-700">
                <div className="text-blue-400 text-4xl mb-4">👥</div>
                <h3 className="text-2xl font-bold mb-3">Team Management</h3>
                <p className="text-gray-400 mb-4">
                  Manage users, permissions, and access across your organization with centralized controls.
                </p>
                <ul className="text-gray-300 space-y-2">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>User provisioning</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Team collaboration</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Activity monitoring</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-xl border border-gray-700">
                <div className="text-blue-400 text-4xl mb-4">📊</div>
                <h3 className="text-2xl font-bold mb-3">Advanced Analytics</h3>
                <p className="text-gray-400 mb-4">
                  Comprehensive insights into AI usage, costs, and performance across your organization.
                </p>
                <ul className="text-gray-300 space-y-2">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Cost tracking</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Usage analytics</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Performance metrics</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-xl border border-gray-700">
                <div className="text-blue-400 text-4xl mb-4">🔒</div>
                <h3 className="text-2xl font-bold mb-3">Compliance</h3>
                <p className="text-gray-400 mb-4">
                  Meet regulatory requirements with built-in compliance features and controls.
                </p>
                <ul className="text-gray-300 space-y-2">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>GDPR ready</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>HIPAA eligible</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>ISO 27001 aligned</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-xl border border-gray-700">
                <div className="text-blue-400 text-4xl mb-4">🔄</div>
                <h3 className="text-2xl font-bold mb-3">Custom Integrations</h3>
                <p className="text-gray-400 mb-4">
                  Connect with your existing tools and workflows through flexible APIs and SDKs.
                </p>
                <ul className="text-gray-300 space-y-2">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>REST API</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>JavaScript SDK</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Python SDK</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-xl border border-gray-700">
                <div className="text-blue-400 text-4xl mb-4">🛠️</div>
                <h3 className="text-2xl font-bold mb-3">Dedicated Support</h3>
                <p className="text-gray-400 mb-4">
                  Priority support with dedicated customer success managers for enterprise accounts.
                </p>
                <ul className="text-gray-300 space-y-2">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>24/7 support</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Customer success</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Training & onboarding</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-xl border border-gray-700">
                <div className="text-blue-400 text-4xl mb-4">🌐</div>
                <h3 className="text-2xl font-bold mb-3">Global Infrastructure</h3>
                <p className="text-gray-400 mb-4">
                  Deploy globally with low-latency access and data residency options.
                </p>
                <ul className="text-gray-300 space-y-2">
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Multi-region deployment</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Data residency options</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Edge computing</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Enterprise AI?</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
              Schedule a personalized demo with our enterprise solutions team.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/contact" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold transition-all transform hover:scale-105 shadow-lg">
                Contact Sales
              </Link>
              <Link href="/pricing" className="px-8 py-4 bg-gray-800/80 hover:bg-gray-700/80 backdrop-blur-sm rounded-lg font-semibold transition-all border border-gray-700">
                View Enterprise Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}