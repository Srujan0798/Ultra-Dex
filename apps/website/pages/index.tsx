import Head from 'next/head';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiZap, FiShield, FiDatabase, FiGlobe, FiUsers, FiGitBranch, FiCode, FiBarChart3, FiClock, FiCheck, FiArrowRight, FiStar, FiTrendingUp, FiCpu, FiLayers, FiTerminal, FiBook, FiGithub, FiTwitter, FiMessageSquare } from 'react-icons/fi';

export default function HomePage() {
  const features = [
    {
      icon: <FiZap className="h-8 w-8" />,
      title: 'Multi-Agent Orchestration',
      description: 'Coordinate specialized AI agents with autonomous task delegation and verification'
    },
    {
      icon: <FiShield className="h-8 w-8" />,
      title: 'Enterprise Security',
      description: 'SSO, MFA, RBAC, audit logging, and encryption at rest/in transit'
    },
    {
      icon: <FiDatabase className="h-8 w-8" />,
      title: 'Tiered Memory System',
      description: 'Hot/Warm/Cold memory architecture with intelligent caching'
    },
    {
      icon: <FiGlobe className="h-8 w-8" />,
      title: 'Multi-Provider Support',
      description: 'Connect to OpenAI, Anthropic, Google, Ollama, and custom providers'
    },
    {
      icon: <FiUsers className="h-8 w-8" />,
      title: 'Multi-Tenancy',
      description: 'Complete resource isolation between organizations and teams'
    },
    {
      icon: <FiGitBranch className="h-8 w-8" />,
      title: 'MCP Integration',
      description: 'Model Context Protocol for tool integration and extensibility'
    }
  ];

  const testimonials = [
    {
      quote: 'Ultra-Dex transformed how we build AI applications. The multi-agent orchestration is revolutionary.',
      author: 'Sarah Chen',
      role: 'CTO, TechCorp',
      avatar: '/avatars/sarah.jpg'
    },
    {
      quote: 'Enterprise-grade security with developer-friendly UX. Exactly what we needed for our AI initiatives.',
      author: 'Michael Rodriguez',
      role: 'Engineering Director, Fortune 500',
      avatar: '/avatars/michael.jpg'
    },
    {
      quote: 'The memory system and visual debugging tools saved us countless hours in development and troubleshooting.',
      author: 'Priya Patel',
      role: 'Lead AI Engineer, StartupXYZ',
      avatar: '/avatars/priya.jpg'
    }
  ];

  const stats = [
    { value: '10,000+', label: 'Active Users' },
    { value: '2.5M+', label: 'Tasks Orchestration' },
    { value: '99.99%', label: 'Uptime' },
    { value: '24/7', label: 'Enterprise Support' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Head>
        <title>Ultra-Dex - AI Orchestration Meta-Layer for SaaS Development</title>
        <meta name="description" content="Enterprise-grade AI orchestration platform for SaaS development" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">UD</span>
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">Ultra-Dex</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <Link href="/" className="text-gray-900 hover:text-indigo-600">Home</Link>
              <Link href="/features" className="text-gray-600 hover:text-indigo-600">Features</Link>
              <Link href="/docs" className="text-gray-600 hover:text-indigo-600">Docs</Link>
              <Link href="/pricing" className="text-gray-600 hover:text-indigo-600">Pricing</Link>
              <Link href="/enterprise" className="text-gray-600 hover:text-indigo-600">Enterprise</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-gray-600 hover:text-indigo-600">Sign In</Link>
              <Link href="/signup" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl"
              >
                <span className="block">AI Orchestration</span>
                <span className="block text-indigo-600">Meta-Layer for SaaS</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mt-4 text-xl text-gray-600 sm:mt-6 sm:max-w-xl sm:mx-auto lg:mx-0"
              >
                The enterprise-grade AI orchestration platform that coordinates agents, models, memory, and tools. 
                Build with confidence, scale with ease.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0"
              >
                <div className="flex flex-col sm:flex-row sm:justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
                  <Link href="/signup" className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-indigo-700 flex items-center justify-center">
                    Start Building Today
                    <FiArrowRight className="ml-2" />
                  </Link>
                  <Link href="/demo" className="bg-white text-gray-900 px-8 py-4 rounded-lg text-lg font-medium border border-gray-300 hover:bg-gray-50 flex items-center justify-center">
                    Watch Demo
                  </Link>
                </div>
              </motion.div>
            </div>
            <div className="mt-16 sm:mt-24 lg:mt-0 lg:col-span-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-xl overflow-hidden"
              >
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="bg-white/20 w-3 h-3 rounded-full mr-2"></div>
                      <div className="bg-white/20 w-3 h-3 rounded-full mr-2"></div>
                      <div className="bg-white/20 w-3 h-3 rounded-full"></div>
                    </div>
                    <div className="text-white text-sm font-medium">ultra-dex.ai</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-6 font-mono text-sm text-white">
                    <div className="mb-4">
                      <span className="text-green-400">$ ultra-dex run --task "Create an Express server with health endpoint"</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                        <span>Ralph: Planning</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                        <span>@backend: Executing</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-purple-500 mr-3"></div>
                        <span>Memory: Storing context</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                        <span>✅ Task completed successfully</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-gray-600 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Enterprise-Grade <span className="text-indigo-600">AI Orchestration</span>
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to build, deploy, and scale AI-powered applications with confidence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow"
              >
                <div className="text-indigo-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How Ultra-Dex Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our AI orchestration meta-layer coordinates specialized agents to accomplish complex tasks
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Think',
                description: 'Nexus orchestrator analyzes the objective and coordinates specialized agents',
                icon: <FiCpu className="h-8 w-8" />
              },
              {
                step: '2',
                title: 'Act',
                description: 'Agents execute coordinated tasks using tools and AI providers',
                icon: <FiTerminal className="h-8 w-8" />
              },
              {
                step: '3',
                title: 'Verify',
                description: 'Results are verified and committed to persistent memory',
                icon: <FiCheck className="h-8 w-8" />
              }
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                  <div className="bg-indigo-600 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold">
                    {step.step}
                  </div>
                </div>
                <div className="text-indigo-600 mb-4 flex justify-center">{step.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-20 bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Trusted by Enterprise Teams</h2>
            <p className="text-xl text-indigo-100 max-w-2xl mx-auto">
              Join thousands of developers building the future with Ultra-Dex
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-8"
              >
                <div className="flex items-center mb-4">
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16" />
                  <div className="ml-4">
                    <h4 className="font-bold">{testimonial.author}</h4>
                    <p className="text-indigo-200">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-indigo-100 italic">"{testimonial.quote}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Transform Your AI Development?</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Join thousands of developers building the future with Ultra-Dex.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/signup" className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-indigo-700 flex items-center justify-center">
              Get Started Free
            </Link>
            <Link href="/enterprise" className="bg-white text-gray-900 px-8 py-4 rounded-lg text-lg font-medium border border-gray-300 hover:bg-gray-50 flex items-center justify-center">
              Enterprise Demo
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="bg-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">UD</span>
                </div>
                <span className="ml-2 text-xl font-bold">Ultra-Dex</span>
              </div>
              <p className="text-gray-400">
                AI orchestration infrastructure for the enterprise era.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/docs" className="hover:text-white">Documentation</Link></li>
                <li><Link href="/api" className="hover:text-white">API Reference</Link></li>
                <li><Link href="/enterprise" className="hover:text-white">Enterprise</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/security" className="hover:text-white">Security</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Connect</h3>
              <div className="flex space-x-4 mb-4">
                <Link href="https://github.com/ultra-dex" className="text-gray-400 hover:text-white">
                  <FiGithub className="h-6 w-6" />
                </Link>
                <Link href="https://twitter.com/ultra_dex" className="text-gray-400 hover:text-white">
                  <FiTwitter className="h-6 w-6" />
                </Link>
                <Link href="/docs" className="text-gray-400 hover:text-white">
                  <FiBook className="h-6 w-6" />
                </Link>
                <Link href="https://ultra-dex.ai/discord" className="text-gray-400 hover:text-white">
                  <FiMessageSquare className="h-6 w-6" />
                </Link>
              </div>
              <p className="text-gray-400 text-sm">
                Enterprise Support<br />
                24/7 Availability<br />
                SLA Guaranteed
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2026 Ultra-Dex. All rights reserved. Enterprise-grade AI orchestration platform.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}