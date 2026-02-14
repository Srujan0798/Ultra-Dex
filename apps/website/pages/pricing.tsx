import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { FiCheck, FiX, FiStar, FiZap, FiShield, FiUsers, FiCpu, FiDatabase, FiGlobe, FiTrendingUp, FiCreditCard, FiBarChart3, FiDollarSign, FiCalculator } from 'react-icons/fi';

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [selectedPlan, setSelectedPlan] = useState(null);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      description: 'For individual developers and hobby projects',
      price: { monthly: 0, annually: 0 },
      highlighted: false,
      features: [
        '1 agent',
        '100 requests/month',
        'Basic memory system',
        'Community support',
        'Open source license',
        'Limited to personal use'
      ],
      limits: {
        agents: 1,
        requestsPerMonth: 100,
        memoryEntries: 1000,
        concurrentAgents: 1
      }
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For professional developers and small teams',
      price: { monthly: 49, annually: 490 }, // 10% discount for annual
      highlighted: false,
      features: [
        '10 agents',
        'Unlimited requests',
        'Advanced memory system',
        'Priority support',
        'Custom configurations',
        'API access',
        'Basic analytics'
      ],
      limits: {
        agents: 10,
        requestsPerMonth: Infinity,
        memoryEntries: 10000,
        concurrentAgents: 5
      }
    },
    {
      id: 'team',
      name: 'Team',
      description: 'For growing teams and departments',
      price: { monthly: 199, annually: 1990 }, // 10% discount for annual
      highlighted: true,
      popular: true,
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
      limits: {
        agents: 50,
        requestsPerMonth: Infinity,
        memoryEntries: 100000,
        concurrentAgents: 20,
        teamMembers: 10
      }
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For large organizations with advanced requirements',
      price: { monthly: 999, annually: 9990 }, // 10% discount for annual
      highlighted: false,
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
        'Custom integrations',
        'Security audit included',
        'Training & onboarding'
      ],
      limits: {
        agents: Infinity,
        requestsPerMonth: Infinity,
        memoryEntries: Infinity,
        concurrentAgents: Infinity,
        teamMembers: Infinity,
        customAgents: Infinity
      }
    }
  ];

  const faqs = [
    {
      question: "Can I change plans later?",
      answer: "Yes, you can upgrade, downgrade, or switch billing cycles at any time. Changes take effect immediately with prorated billing."
    },
    {
      question: "Do you offer custom enterprise plans?",
      answer: "Yes, our Enterprise plan is fully customizable to meet your organization's specific requirements. Contact our sales team for a tailored solution."
    },
    {
      question: "Is there a free trial for paid plans?",
      answer: "Yes, we offer a 14-day free trial for our Pro, Team, and Enterprise plans with full feature access. No credit card required."
    },
    {
      question: "How are requests counted?",
      answer: "A request is counted each time an agent processes a task or generates a response. This includes planning, coding, reviewing, and testing operations."
    },
    {
      question: "Do you offer volume discounts?",
      answer: "Yes, we offer volume discounts for high-usage customers. Contact our sales team for more information on our volume pricing tiers."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, bank transfers, and ACH payments. Enterprise customers can also pay via purchase order."
    }
  ];

  const roiCalculators = [
    {
      title: 'Developer Productivity',
      description: 'Calculate time savings from AI automation',
      inputs: [
        { id: 'devHours', label: 'Developer hours saved per week', type: 'number', defaultValue: 20 },
        { id: 'hourlyRate', label: 'Average hourly rate', type: 'number', defaultValue: 150 }
      ],
      calculate: (inputs) => {
        const hoursSaved = inputs.devHours || 0;
        const hourlyRate = inputs.hourlyRate || 150;
        const monthlyValue = hoursSaved * 4 * hourlyRate; // 4 weeks in a month
        return {
          monthlyValue,
          yearlyValue: monthlyValue * 12,
          description: `Save $${monthlyValue.toLocaleString()}/month in developer time`
        };
      }
    },
    {
      title: 'Team Efficiency',
      description: 'Calculate efficiency gains from multi-agent coordination',
      inputs: [
        { id: 'teamSize', label: 'Team size', type: 'number', defaultValue: 5 },
        { id: 'efficiencyGain', label: 'Efficiency gain percentage', type: 'number', defaultValue: 30 }
      ],
      calculate: (inputs) => {
        const teamSize = inputs.teamSize || 0;
        const efficiencyGain = inputs.efficiencyGain || 0;
        const monthlyValue = teamSize * 160 * (efficiencyGain / 100) * 100; // 160 hours/month * gain * $100/hour value
        return {
          monthlyValue,
          yearlyValue: monthlyValue * 12,
          description: `Gain ${efficiencyGain}% efficiency across ${teamSize}-person team`
        };
      }
    }
  ];

  const [roiInputs, setRoiInputs] = useState({
    devHours: 20,
    hourlyRate: 150,
    teamSize: 5,
    efficiencyGain: 30
  });

  const calculateRoi = (calculator) => {
    return calculator.calculate(roiInputs);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Pricing - Ultra-Dex AI Orchestration</title>
        <meta name="description" content="Ultra-Dex pricing plans for AI orchestration platform" />
      </Head>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Simple, Transparent <span className="text-indigo-200">Pricing</span>
            </h1>
            <p className="text-xl text-indigo-100 max-w-3xl mx-auto">
              Choose the plan that fits your needs. All plans include our core AI orchestration features.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mb-16">
          <div className="relative inline-flex items-center bg-gray-200 rounded-full p-1">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`relative inline-flex items-center px-6 py-2 rounded-full text-sm font-medium ${
                billingCycle === 'monthly' 
                  ? 'bg-white text-gray-900 shadow' 
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annually')}
              className={`relative inline-flex items-center px-6 py-2 rounded-full text-sm font-medium ${
                billingCycle === 'annually' 
                  ? 'bg-white text-gray-900 shadow' 
                  : 'text-gray-700 hover:text-gray-900'
              }`}
            >
              Annually <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">Save 10%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-20">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className={`rounded-2xl p-8 ${
                plan.highlighted 
                  ? 'bg-white border-2 border-indigo-500 shadow-xl relative' 
                  : 'bg-white border border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-indigo-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                    <FiStar className="mr-1" /> Most Popular
                  </span>
                </div>
              )}
              
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h2>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                
                <div className="mb-8">
                  <span className="text-4xl font-extrabold text-gray-900">
                    ${plan.price[billingCycle]}
                  </span>
                  <span className="text-gray-600">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                </div>
                
                <button
                  onClick={() => setSelectedPlan(plan)}
                  className={`w-full py-3 px-6 rounded-md font-medium text-center ${
                    plan.highlighted
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.id === 'free' ? 'Get Started' : 'Start Free Trial'}
                </button>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Features</h3>
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <FiCheck className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Limits</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>Agents: {plan.limits.agents === Infinity ? 'Unlimited' : plan.limits.agents}</li>
                    <li>Requests: {plan.limits.requestsPerMonth === Infinity ? 'Unlimited' : `${plan.limits.requestsPerMonth}/month`}</li>
                    <li>Memory: {plan.limits.memoryEntries === Infinity ? 'Unlimited' : `${plan.limits.memoryEntries} entries`}</li>
                    <li>Concurrent: {plan.limits.concurrentAgents === Infinity ? 'Unlimited' : plan.limits.concurrentAgents}</li>
                    {plan.limits.teamMembers && <li>Team members: {plan.limits.teamMembers}</li>}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ROI Calculator */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Calculate Your ROI</h2>
            <p className="text-lg text-gray-600">
              See how Ultra-Dex can save you time and money
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {roiCalculators.map((calculator, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{calculator.title}</h3>
                <p className="text-gray-600 mb-4">{calculator.description}</p>
                
                <div className="space-y-4">
                  {calculator.inputs.map((input) => (
                    <div key={input.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {input.label}
                      </label>
                      <input
                        type={input.type}
                        value={roiInputs[input.id]}
                        onChange={(e) => setRoiInputs(prev => ({
                          ...prev,
                          [input.id]: input.type === 'number' ? Number(e.target.value) : e.target.value
                        }))}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                  ))}
                  
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Estimated Value:</h4>
                    {(() => {
                      const result = calculator.calculate(roiInputs);
                      return (
                        <div>
                          <p className="text-2xl font-bold text-indigo-600">${result.monthlyValue.toLocaleString()}/month</p>
                          <p className="text-sm text-gray-600">${result.yearlyValue.toLocaleString()}/year</p>
                          <p className="text-sm text-gray-700 mt-2">{result.description}</p>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Comparison */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-16">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Feature Comparison</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature</th>
                  {plans.map((plan) => (
                    <th key={plan.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Agents</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {plan.limits.agents === Infinity ? 'Unlimited' : plan.limits.agents}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Monthly Requests</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {plan.limits.requestsPerMonth === Infinity ? 'Unlimited' : plan.limits.requestsPerMonth.toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Memory Entries</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {plan.limits.memoryEntries === Infinity ? 'Unlimited' : plan.limits.memoryEntries.toLocaleString()}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Concurrent Agents</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {plan.limits.concurrentAgents === Infinity ? 'Unlimited' : plan.limits.concurrentAgents}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">SSO Integration</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {plan.id === 'enterprise' ? <FiCheck className="h-5 w-5 text-green-500 mx-auto" /> : <FiX className="h-5 w-5 text-gray-400 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Advanced Security</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {['team', 'enterprise'].includes(plan.id) ? <FiCheck className="h-5 w-5 text-green-500 mx-auto" /> : <FiX className="h-5 w-5 text-gray-400 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Dedicated Support</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {plan.id === 'enterprise' ? <FiCheck className="h-5 w-5 text-green-500 mx-auto" /> : <FiX className="h-5 w-5 text-gray-400 mx-auto" />}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">SLA Guarantees</td>
                  {plans.map((plan) => (
                    <td key={plan.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {plan.id === 'enterprise' ? <FiCheck className="h-5 w-5 text-green-500 mx-auto" /> : <FiX className="h-5 w-5 text-gray-400 mx-auto" />}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your AI Development?</h2>
          <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-8">
            Join thousands of developers building the future with Ultra-Dex.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/signup" className="bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-100 flex items-center justify-center">
              Start Free Trial
            </Link>
            <Link href="/enterprise" className="bg-indigo-800 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-indigo-900 flex items-center justify-center">
              Contact Sales
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;