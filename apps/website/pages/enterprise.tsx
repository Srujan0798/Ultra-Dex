import Head from 'next/head';
import Link from 'next/link';
import { FiShield, FiUsers, FiLock, FiDatabase, FiServer, FiBarChart3, FiZap, FiGlobe, FiGitBranch, FiCode, FiTerminal, FiTrendingUp, FiCheck, FiArrowRight } from 'react-icons/fi';

export default function EnterprisePage() {
  const enterpriseFeatures = [
    {
      icon: <FiShield className="h-8 w-8" />,
      title: 'Enterprise Security',
      description: 'SSO with SAML/OIDC, MFA, RBAC, and comprehensive audit logging',
      features: [
        'Single Sign-On (SAML 2.0, OIDC)',
        'Multi-Factor Authentication',
        'Role-Based Access Control',
        'Immutable Audit Logs',
        'Data Encryption at Rest & Transit'
      ]
    },
    {
      icon: <FiUsers className="h-8 w-8" />,
      title: 'Multi-Tenancy',
      description: 'Complete resource isolation between organizations and teams',
      features: [
        'Organization Workspaces',
        'Team Management',
        'Resource Quotas',
        'Billing Per Team',
        'Admin Controls'
      ]
    },
    {
      icon: <FiDatabase className="h-8 w-8" />,
      title: 'Compliance',
      description: 'SOC 2, GDPR, and enterprise governance controls',
      features: [
        'SOC 2 Type II Compliance',
        'GDPR Data Protection',
        'HIPAA Controls (where applicable)',
        'ISO 27001 Standards',
        'Enterprise Governance'
      ]
    },
    {
      icon: <FiServer className="h-8 w-8" />,
      title: 'High Availability',
      description: '99.99% uptime with auto-scaling and failover',
      features: [
        'Horizontal Scaling',
        'Auto-Failover',
        'Load Balancing',
        'Backup & Recovery',
        'Disaster Recovery'
      ]
    }
  ];

  const complianceStandards = [
    { name: 'SOC 2 Type II', status: 'Certified', description: 'Security, availability, and confidentiality controls' },
    { name: 'GDPR', status: 'Compliant', description: 'Data protection and privacy regulations' },
    { name: 'ISO 27001', status: 'Aligned', description: 'Information security management system' },
    { name: 'HIPAA', status: 'Ready', description: 'Healthcare data protection controls' },
    { name: 'SOX', status: 'Compliant', description: 'Financial reporting and controls' },
    { name: 'PCI DSS', status: 'Ready', description: 'Payment card industry security standards' }
  ];

  const enterprisePricing = [
    {
      name: 'Enterprise Starter',
      price: 'Custom',
      period: 'contact sales',
      description: 'For mid-market organizations',
      features: [
        'Unlimited agents',
        'All AI providers',
        'SSO & RBAC',
        'Audit logging',
        'Dedicated support',
        '99.9% SLA',
        'On-premise deployment'
      ],
      cta: 'Contact Sales',
      popular: false
    },
    {
      name: 'Enterprise Plus',
      price: 'Custom',
      period: 'contact sales',
      description: 'For large enterprises',
      features: [
        'Everything in Starter',
        'Custom integrations',
        'White-label options',
        'Advanced security',
        '24/7 dedicated support',
        '99.99% SLA',
        'Private MCP servers',
        'Custom SLA terms'
      ],
      cta: 'Contact Sales',
      popular: true
    },
    {
      name: 'Enterprise Ultimate',
      price: 'Custom',
      period: 'contact sales',
      description: 'For Fortune 500 companies',
      features: [
        'Everything in Plus',
        'On-premise + cloud hybrid',
        'Custom development',
        'Executive support',
        'Security audit included',
        'Custom compliance controls',
        'Training & onboarding',
        'Success management'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Enterprise - Ultra-Dex AI Orchestration</title>
        <meta name="description" content="Enterprise-grade AI orchestration platform" />
      </Head>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-gray-900 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Enterprise-Grade AI Orchestration
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10">
              Fortified for Fortune 500 companies with security, compliance, and scalability at the core.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/contact" className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-indigo-700 flex items-center justify-center">
                Contact Sales
                <FiArrowRight className="ml-2" />
              </Link>
              <Link href="/demo" className="bg-white text-gray-900 px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-100 flex items-center justify-center">
                Schedule Demo
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Indicators */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Trusted by Enterprise Leaders</h2>
            <div className="flex flex-wrap justify-center gap-12 mt-8">
              {['Fortune 500', 'SOC 2 Certified', 'GDPR Compliant', 'ISO 27001'].map((badge, idx) => (
                <div key={idx} className="flex items-center">
                  <FiCheck className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-700 font-medium">{badge}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Features */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Built for the Enterprise</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Ultra-Dex provides the security, compliance, and scalability that enterprise organizations require.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {enterpriseFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="text-indigo-600 mb-4 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.features.map((feat, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-700">
                      <FiCheck className="h-4 w-4 text-green-500 mr-2" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compliance Section */}
      <div className="bg-gray-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Compliance & Security Standards</h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Ultra-Dex meets the highest enterprise security and compliance requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {complianceStandards.map((standard, index) => (
              <div key={index} className="bg-gray-800 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium">{standard.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    standard.status === 'Certified' || standard.status === 'Compliant' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {standard.status}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">{standard.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Architecture Diagram */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Enterprise Architecture</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Designed for security, scalability, and compliance from the ground up.
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Security Layer</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center"><FiShield className="mr-2 text-indigo-600" /> SSO Integration</li>
                  <li className="flex items-center"><FiLock className="mr-2 text-indigo-600" /> Data Encryption</li>
                  <li className="flex items-center"><FiUsers className="mr-2 text-indigo-600" /> RBAC Controls</li>
                  <li className="flex items-center"><FiDatabase className="mr-2 text-indigo-600" /> Audit Logging</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Orchestration Layer</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center"><FiZap className="mr-2 text-indigo-600" /> Multi-Agent Coordination</li>
                  <li className="flex items-center"><FiGlobe className="mr-2 text-indigo-600" /> Multi-Provider Support</li>
                  <li className="flex items-center"><FiGitBranch className="mr-2 text-indigo-600" /> MCP Integration</li>
                  <li className="flex items-center"><FiCode className="mr-2 text-indigo-600" /> Tool Execution</li>
                </ul>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Infrastructure Layer</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center"><FiServer className="mr-2 text-indigo-600" /> High Availability</li>
                  <li className="flex items-center"><FiBarChart3 className="mr-2 text-indigo-600" /> Performance Monitoring</li>
                  <li className="flex items-center"><FiTrendingUp className="mr-2 text-indigo-600" /> Auto-Scaling</li>
                  <li className="flex items-center"><FiTerminal className="mr-2 text-indigo-600" /> Enterprise Deployment</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Pricing */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Enterprise Plans</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Customized solutions for your organization's specific needs and requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {enterprisePricing.map((plan, index) => (
              <div 
                key={index} 
                className={`rounded-2xl p-8 ${
                  plan.popular 
                    ? 'bg-white border-2 border-indigo-500 shadow-xl relative' 
                    : 'bg-white border border-gray-200'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                    <span className="text-gray-600">/{plan.period}</span>
                  </div>
                  <p className="text-gray-600">{plan.description}</p>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <FiCheck className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button className={`w-full py-3 px-6 rounded-md font-medium text-center ${
                  plan.popular
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Enterprise AI?</h2>
          <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-8">
            Join leading enterprises using Ultra-Dex for secure, compliant AI orchestration.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/contact" className="bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-100 flex items-center justify-center">
              Contact Sales
            </Link>
            <Link href="/demo" className="bg-indigo-800 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-indigo-900 flex items-center justify-center">
              Schedule Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}