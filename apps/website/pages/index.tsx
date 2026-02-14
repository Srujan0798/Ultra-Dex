import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { FiCheck, FiStar, FiZap, FiShield, FiUsers, FiCpu, FiDatabase, FiGlobe, FiTrendingUp, FiCreditCard, FiBarChart3, FiDollarSign, FiCalculator, FiCode, FiTool, FiLock, FiActivity, FiSettings, FiTerminal, FiServer, FiCloud, FiGitBranch, FiDatabase, FiHardDrive, FiLayers, FiGrid, FiBox, FiSmartphone, FiMonitor, FiCpu, FiZap, FiShield, FiUsers, FiGlobe, FiTrendingUp, FiCreditCard, FiBarChart3, FiDollarSign, FiCalculator, FiCode, FiTool, FiLock, FiActivity, FiSettings, FiTerminal, FiServer, FiCloud, FiGitBranch } from 'react-icons/fi';

const LandingPage = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, you would call your API here
      console.log('Email submitted:', email);
      setSubmitSuccess(true);
      setEmail('');
      
      // Reset success message after 5 seconds
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      setSubmitError('Failed to submit email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: <FiZap className="h-6 w-6" />,
      title: "Lightning Fast",
      description: "Sub-second response times with intelligent caching and optimization"
    },
    {
      icon: <FiShield className="h-6 w-6" />,
      title: "Enterprise Security",
      description: "SSO, MFA, RBAC, audit logging, and SOC 2 compliance built-in"
    },
    {
      icon: <FiUsers className="h-6 w-6" />,
      title: "Multi-Agent Coordination",
      description: "Coordinate specialized AI agents with visual debugging and monitoring"
    },
    {
      icon: <FiDatabase className="h-6 w-6" />,
      title: "Tiered Memory",
      description: "Hot/Warm/Cold memory system with intelligent caching and persistence"
    },
    {
      icon: <FiGlobe className="h-6 w-6" />,
      title: "Global Scale",
      description: "Horizontally scalable with load balancing and auto-scaling"
    },
    {
      icon: <FiTrendingUp className="h-6 w-6" />,
      title: "Visual Orchestration",
      description: "Real-time execution flow visualization with click-to-inspect"
    }
  ];

  const pricingPlans = [
    {
      name: 'Free',
      description: 'For individual developers and hobby projects',
      price: '$0',
      period: 'forever',
      features: [
        '1 agent',
        '100 requests/month',
        'Basic memory system',
        'Community support',
        'Open source license'
      ],
      cta: 'Get Started',
      popular: false
    },
    {
      name: 'Pro',
      description: 'For professional developers and small teams',
      price: '$49',
      period: 'per month',
      features: [
        '10 agents',
        'Unlimited requests',
        'Advanced memory system',
        'Priority support',
        'Custom configurations',
        'API access',
        'Basic analytics'
      ],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      name: 'Team',
      description: 'For growing teams and departments',
      price: '$199',
      period: 'per month',
      features: [
        '50 agents',
        'Unlimited requests',
        'Enterprise memory system',
        'Priority support',
        'Team management',
        'Usage analytics',
        'Custom integrations',
        'SLA guarantees',
        'Advanced security'
      ],
      cta: 'Start Free Trial',
      popular: false
    },
    {
      name: 'Enterprise',
      description: 'For large organizations with advanced requirements',
      price: '$999',
      period: 'per month',
      features: [
        'Unlimited agents',
        'Unlimited requests',
        'All features included',
        'SSO with SAML/OIDC',
        'Advanced RBAC',
        'Compliance controls',
        'Audit logging',
        'Custom agent development',
        'Dedicated support',
        'SLA guarantees',
        'On-premise deployment',
        'Custom integrations'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  const testimonials = [
    {
      quote: "Ultra-Dex transformed how we build AI applications. The visual debugging and multi-agent coordination saved us months of development time.",
      author: "Sarah Chen",
      role: "CTO, TechCorp",
      avatar: "/avatars/sarah.jpg"
    },
    {
      quote: "The enterprise security features were exactly what we needed. SOC 2 compliance with SSO integration made adoption easy across our organization.",
      author: "Michael Rodriguez",
      role: "Engineering Director, FinTech Inc",
      avatar: "/avatars/michael.jpg"
    },
    {
      quote: "Finally, an AI orchestration platform that's actually delightful to use. The developer experience is exceptional.",
      author: "Emily Johnson",
      role: "Lead Developer, AI Startup",
      avatar: "/avatars/emily.jpg"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Head>
        <title>Ultra-Dex AI Orchestration Platform</title>
        <meta name="description" content="Enterprise-grade AI orchestration with visual debugging and enterprise security" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <FiGrid className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">Ultra-Dex</span>
              </div>
              <div className="hidden md:ml-10 md:flex md:space-x-8">
                <a href="#features" className="text-gray-500 hover:text-gray-700 px-1 pt-1 font-medium">Features</a>
                <a href="#pricing" className="text-gray-500 hover:text-gray-700 px-1 pt-1 font-medium">Pricing</a>
                <a href="#docs" className="text-gray-500 hover:text-gray-700 px-1 pt-1 font-medium">Docs</a>
                <a href="#contact" className="text-gray-500 hover:text-gray-700 px-1 pt-1 font-medium">Contact</a>
              </div>
            </div>
            <div className="flex items-center">
              <Link href="/login" className="text-gray-500 hover:text-gray-700 px-3 py-2 font-medium">
                Sign In
              </Link>
              <Link href="/signup" className="ml-4 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-gradient-to-br from-gray-50 to-gray-100 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">Enterprise AI</span>
                  <span className="block text-indigo-600">Orchestration Platform</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  The only AI orchestration platform that combines enterprise-grade security with delightful developer experience. Coordinate specialized AI agents with visual debugging, tiered memory, and enterprise controls.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link href="/signup" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10">
                      Start Free Trial
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link href="/demo" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 md:py-4 md:text-lg md:px-10">
                      Live Demo
                    </Link>
                  </div>
                </div>
                <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-6">
                  <div className="flex items-center text-sm text-gray-500">
                    <FiCheck className="h-5 w-5 text-green-500 mr-2" />
                    2-minute setup guarantee
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <FiCheck className="h-5 w-5 text-green-500 mr-2" />
                    SOC 2 & GDPR compliant
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <FiCheck className="h-5 w-5 text-green-500 mr-2" />
                    99.95% uptime SLA
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <div className="h-56 w-full bg-gradient-to-r from-indigo-500 to-purple-600 sm:h-72 md:h-96 lg:w-full lg:h-full flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-11/12 h-5/6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Live Dashboard</h3>
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm font-medium text-gray-700">Agent Status</span>
                  <span className="text-sm text-green-600">Healthy</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm font-medium text-gray-700">Memory Utilization</span>
                  <span className="text-sm text-blue-600">65%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm font-medium text-gray-700">Active Agents</span>
                  <span className="text-sm text-purple-600">12</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-sm font-medium text-gray-700">API Calls</span>
                  <span className="text-sm text-indigo-600">1,248</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Everything you need for enterprise AI
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Built for developers, designed for enterprises, powered by AI.
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <div key={index} className="pt-6">
                  <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                    <div className="-mt-6">
                      <div>
                        <span className="inline-flex items-center justify-center p-3 bg-indigo-500 rounded-md shadow-lg text-white">
                          {feature.icon}
                        </span>
                      </div>
                      <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">{feature.title}</h3>
                      <p className="mt-5 text-base text-gray-500">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-indigo-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Trusted by innovative teams
            </h2>
            <p className="mt-3 text-xl text-indigo-200 sm:mt-4">
              Join thousands of developers building the future with Ultra-Dex.
            </p>
          </div>
          <dl className="mt-10 text-center sm:max-w-3xl sm:mx-auto sm:grid sm:grid-cols-3 sm:gap-8">
            <div className="flex flex-col">
              <dt className="order-2 mt-2 text-lg leading-6 font-medium text-indigo-200">
                Active Users
              </dt>
              <dd className="order-1 text-5xl font-extrabold text-white">
                500+
              </dd>
            </div>
            <div className="flex flex-col mt-10 sm:mt-0">
              <dt className="order-2 mt-2 text-lg leading-6 font-medium text-indigo-200">
                Monthly Recurring Revenue
              </dt>
              <dd className="order-1 text-5xl font-extrabold text-white">
                $5K+
              </dd>
            </div>
            <div className="flex flex-col mt-10 sm:mt-0">
              <dt className="order-2 mt-2 text-lg leading-6 font-medium text-indigo-200">
                Enterprise Customers
              </dt>
              <dd className="order-1 text-5xl font-extrabold text-white">
                25+
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">Testimonials</h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Loved by developers and trusted by enterprises
            </p>
          </div>

          <div className="mt-16">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <FiUsers className="h-6 w-6 text-gray-600" />
                      </div>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-sm font-bold text-gray-900">{testimonial.author}</h4>
                      <p className="text-sm text-gray-500">{testimonial.role}</p>
                    </div>
                  </div>
                  <blockquote className="mt-4">
                    <p className="text-base text-gray-600 italic">
                      "{testimonial.quote}"
                    </p>
                  </blockquote>
                  <div className="mt-4 flex">
                    {[...Array(5)].map((_, i) => (
                      <FiStar key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">Pricing</h2>
            <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Plans for every team
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Choose the plan that fits your needs. All plans include our core features.
            </p>
          </div>

          <div className="mt-16 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-x-8">
            {pricingPlans.map((plan, index) => (
              <div 
                key={index} 
                className={`relative p-8 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col ${
                  plan.popular ? 'ring-2 ring-indigo-500' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 py-1.5 px-4 bg-indigo-500 rounded-full text-xs font-semibold uppercase tracking-wide text-white transform -translate-y-1/2">
                    Most popular
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                  <p className="mt-4 flex items-baseline text-gray-900">
                    <span className="text-5xl font-extrabold tracking-tight">{plan.price}</span>
                    <span className="ml-1 text-xl font-semibold">{plan.period}</span>
                  </p>
                  <p className="mt-6 text-gray-500">{plan.description}</p>
                  <ul className="mt-6 space-y-4">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex">
                        <FiCheck className="h-6 w-6 text-green-500 flex-shrink-0" />
                        <span className="ml-3 text-gray-500">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <a
                  href="#"
                  className={`mt-8 block w-full py-3 px-6 text-center font-medium rounded-md ${
                    plan.popular
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8 lg:py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Ready to transform your AI development?
            </h2>
            <p className="mt-4 text-lg text-indigo-200">
              Join thousands of developers building the future with Ultra-Dex.
            </p>
            <form onSubmit={handleSubmit} className="mt-8 sm:flex">
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                type="email"
                id="email-address"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-5 py-3 border border-transparent text-base rounded-md text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-700 focus:ring-white"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-3 w-full sm:mt-0 sm:ml-3 sm:flex-shrink-0 flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-700 focus:ring-white disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Get Started'}
              </button>
            </form>
            {submitSuccess && (
              <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-md">
                Thank you! We've received your email and will be in touch shortly.
              </div>
            )}
            {submitError && (
              <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-md">
                {submitError}
              </div>
            )}
            <p className="mt-3 text-sm text-indigo-200">
              Start your free trial today. No credit card required.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center">
                <FiGrid className="h-8 w-8 text-indigo-400" />
                <span className="ml-2 text-xl font-bold text-white">Ultra-Dex</span>
              </div>
              <p className="mt-4 text-base text-gray-400">
                Enterprise-grade AI orchestration with delightful developer experience.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Product</h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-base text-gray-300 hover:text-white">Features</a></li>
                <li><a href="#" className="text-base text-gray-300 hover:text-white">Pricing</a></li>
                <li><a href="#" className="text-base text-gray-300 hover:text-white">Documentation</a></li>
                <li><a href="#" className="text-base text-gray-300 hover:text-white">API</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Company</h3>
              <ul className="mt-4 space-y-4">
                <li><a href="#" className="text-base text-gray-300 hover:text-white">About</a></li>
                <li><a href="#" className="text-base text-gray-300 hover:text-white">Blog</a></li>
                <li><a href="#" className="text-base text-gray-300 hover:text-white">Careers</a></li>
                <li><a href="#" className="text-base text-gray-300 hover:text-white">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-700 pt-8">
            <p className="text-base text-gray-400 text-center">
              &copy; 2026 Ultra-Dex AI. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;