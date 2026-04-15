import Head from 'next/head';
import Link from 'next/link';
import { Check, Zap, Building2, Users, Terminal } from 'lucide-react';

type Plan = {
  name: string;
  price: string;
  priceLabel: string;
  description: string;
  features: string[];
  cta: string;
  mostPopular?: boolean;
  icon: React.ReactNode;
  href: string;
};

const PLANS: Plan[] = [
  {
    name: 'Free',
    price: '$0',
    priceLabel: 'forever',
    description: 'Open-source SDK for individuals and teams',
    features: [
      'SmartRouter with 4 strategies',
      'All provider adapters',
      'Circuit breakers & middleware',
      'Local cost tracking',
      'Community support',
    ],
    cta: 'Get Started',
    icon: <Terminal className="w-5 h-5" />,
    href: 'https://www.npmjs.com/package/@ultra-dex/sdk',
  },
  {
    name: 'Pro Dashboard',
    price: '$29',
    priceLabel: '/mo',
    description: 'Cloud analytics for teams optimizing AI spend',
    features: [
      'Real-time cost breakdown by provider',
      'Savings reports vs single-provider',
      'Provider health (latency, errors, uptime)',
      'Usage trends & email alerts',
      'Priority support',
    ],
    cta: 'Start Pro',
    mostPopular: true,
    icon: <Zap className="w-5 h-5" />,
    href: '/signup?plan=pro',
  },
  {
    name: 'DexGraph Pro',
    price: '$99',
    priceLabel: '/mo',
    description: 'Workflow orchestration + persistent memory',
    features: [
      'Everything in Pro Dashboard',
      'DexGraph workflow orchestration',
      'Persistent memory & RAG pipeline',
      'Agent coordination layer',
      'YAML workflow DSL',
    ],
    cta: 'Get DexGraph Pro',
    icon: <Users className="w-5 h-5" />,
    href: 'https://www.npmjs.com/package/@ultra-dex/dexgraph',
  },
  {
    name: 'Enterprise',
    price: '$499+',
    priceLabel: '/mo',
    description: 'Governance, SSO, and dedicated support',
    features: [
      'Everything in DexGraph Pro',
      'Governance policies & audit trails',
      'SSO/SAML & RBAC',
      'Multi-tenant architecture',
      'Dedicated support & SLA',
    ],
    cta: 'Contact Sales',
    icon: <Building2 className="w-5 h-5" />,
    href: '/contact',
  },
];

export default function Pricing() {
  return (
    <>
      <Head>
        <title>Pricing — Ultra-Dex</title>
        <meta name="description" content="Simple pricing for Ultra-Dex AI routing and orchestration" />
      </Head>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="text-xs font-mono text-[#00d4ff] uppercase tracking-widest mb-4">
              Pricing
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold text-white mb-6">
              Simple, transparent pricing
            </h1>
            <p className="text-lg text-[#6b7280] max-w-2xl mx-auto">
              Start free with the SDK. Upgrade when you need cloud analytics and orchestration.
            </p>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-[#141418] border p-8 transition-all hover:border-[#00d4ff]/30 ${
                  plan.mostPopular
                    ? 'border-[#00d4ff]/50 shadow-[0_0_30px_rgba(0,212,255,0.1)]'
                    : 'border-[#2a2a35]'
                }`}
              >
                {plan.mostPopular && (
                  <div className="absolute -top-px left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <span className="px-3 py-1 bg-[#00d4ff] text-[#0a0a0c] text-xs font-mono font-semibold uppercase">
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div className="w-10 h-10 flex items-center justify-center border border-[#2a2a35] text-[#00d4ff] mb-6">
                  {plan.icon}
                </div>

                <h2 className="text-xl font-semibold text-white mb-2">{plan.name}</h2>
                <p className="text-sm text-[#6b7280] mb-4">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-semibold text-white">{plan.price}</span>
                  <span className="text-sm text-[#6b7280]">{plan.priceLabel}</span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-[#a0a0a8]">
                      <Check className="w-4 h-4 text-[#00d4ff] mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={plan.href}
                  className={`block text-center px-4 py-3 text-sm font-medium transition-all ${
                    plan.mostPopular
                      ? 'border border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff]/10'
                      : 'border border-[#2a2a35] text-[#a0a0a8] hover:border-[#00d4ff]/50 hover:text-white'
                  } ${plan.cta === 'Coming Soon' ? 'pointer-events-none opacity-60' : ''}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
