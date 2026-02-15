import Head from 'next/head';
import Link from 'next/link';

export default function Pricing() {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for individuals getting started',
      features: [
        '1 agent',
        '100 requests/month',
        'Basic memory',
        'Community support',
        'Limited integrations'
      ],
      cta: 'Get Started',
      mostPopular: false
    },
    {
      name: 'Pro',
      price: '$49',
      period: 'per month',
      description: 'For professionals and small teams',
      features: [
        '10 agents',
        'Unlimited requests',
        'Advanced memory',
        'Priority support',
        'Team collaboration (up to 5)',
        'API access',
        'Custom integrations'
      ],
      cta: 'Start Free Trial',
      mostPopular: true
    },
    {
      name: 'Team',
      price: '$199',
      period: 'per month',
      description: 'For growing teams and departments',
      features: [
        '50 agents',
        'Unlimited requests',
        'Enterprise memory',
        'Team management',
        'SLA guarantees',
        'Advanced analytics',
        'Custom integrations'
      ],
      cta: 'Start Free Trial',
      mostPopular: false
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For large organizations with custom needs',
      features: [
        'Unlimited agents',
        'Unlimited requests',
        'All features included',
        'SSO/SAML',
        'Dedicated support',
        'On-premise option',
        'Custom SLA',
        'Security audit'
      ],
      cta: 'Contact Sales',
      mostPopular: false
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <Head>
        <title>Ultra-Dex Pricing | Flexible Plans for Every Team</title>
        <meta name="description" content="Simple, transparent pricing for Ultra-Dex. No hidden fees, cancel anytime." />
        <meta name="keywords" content="AI orchestration pricing, AI agent pricing, multi-agent system pricing" />
        <link rel="canonical" href="https://ultra-dex.dev/pricing" />
      </Head>

      <section className="py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Simple, <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Transparent</span> Pricing
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Choose the plan that fits your needs. All plans include core features.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan, index) => (
              <div 
                key={index} 
                className={`rounded-2xl border p-8 relative overflow-hidden ${
                  plan.mostPopular 
                    ? 'border-blue-500 bg-gradient-to-b from-gray-800 to-gray-900 ring-2 ring-blue-500/20' 
                    : 'border-gray-700 bg-gray-800/50'
                }`}
              >
                {plan.mostPopular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-6 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-gray-400">/{plan.period}</span>}
                </div>
                <p className="text-gray-400 mb-8">{plan.description}</p>
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="text-green-500 mr-2 mt-1">✓</span>
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link 
                  href={plan.name === 'Enterprise' ? '/contact' : '/signup'} 
                  className={`w-full py-3 rounded-lg font-semibold block text-center transition-all ${
                    plan.mostPopular
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-20 bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-2">What counts as a request?</h3>
                <p className="text-gray-400">A request is a single interaction with an AI model through Ultra-Dex. This includes agent executions, memory operations, and API calls.</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Can I change plans anytime?</h3>
                <p className="text-gray-400">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Do you offer discounts for non-profits?</h3>
                <p className="text-gray-400">Yes, we offer special pricing for educational institutions and non-profit organizations. Contact us for more information.</p>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Is there a setup fee?</h3>
                <p className="text-gray-400">No, there are no setup fees or hidden costs. What you see is what you pay.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}