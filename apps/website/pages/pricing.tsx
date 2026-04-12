import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { Check, Zap, Building2, Users, Terminal } from 'lucide-react';

type Billing = 'monthly' | 'yearly';

type Plan = {
  name: string;
  monthly: number | null;
  description: string;
  features: string[];
  cta: string;
  mostPopular?: boolean;
  icon: React.ReactNode;
};

const PLANS: Plan[] = [
  {
    name: 'Free',
    monthly: 0,
    description: 'For individuals exploring',
    features: ['1 agent', '100 requests/month', 'Basic memory', 'Community support'],
    cta: 'Start Free',
    icon: <Terminal className="w-5 h-5" />,
  },
  {
    name: 'Pro',
    monthly: 49,
    description: 'For professionals',
    features: ['10 agents', 'Unlimited requests', 'Advanced memory', 'Priority support', 'API access'],
    cta: 'Start Pro',
    mostPopular: true,
    icon: <Zap className="w-5 h-5" />,
  },
  {
    name: 'Team',
    monthly: 199,
    description: 'For growing teams',
    features: ['50 agents', 'Team workspaces', 'SLA guarantees', 'Advanced analytics', 'SSO add-on'],
    cta: 'Start Team',
    icon: <Users className="w-5 h-5" />,
  },
  {
    name: 'Enterprise',
    monthly: null,
    description: 'For organizations',
    features: ['Unlimited agents', 'Private deployment', 'Compliance support', 'Dedicated engineer'],
    cta: 'Contact Sales',
    icon: <Building2 className="w-5 h-5" />,
  },
];

function displayPrice(monthly: number | null, billing: Billing): string {
  if (monthly === null) return 'Custom';
  if (billing === 'monthly') return `$${monthly}`;
  const yearly = Math.round(monthly * 12 * 0.8);
  return `$${yearly}`;
}

export default function Pricing() {
  const [billing, setBilling] = useState<Billing>('monthly');

  return (
    <>
      <Head>
        <title>Pricing — Ultra-Dex</title>
        <meta name="description" content="Transparent pricing for Ultra-Dex workflow orchestration" />
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
              Choose a plan that fits your team. Switch anytime.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center gap-1 p-1 border border-[#2a2a35] bg-[#141418]">
              <button
                type="button"
                onClick={() => setBilling('monthly')}
                className={`px-4 py-2 text-sm font-medium transition-all ${
                  billing === 'monthly'
                    ? 'bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/30'
                    : 'text-[#6b7280] hover:text-white'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBilling('yearly')}
                className={`px-4 py-2 text-sm font-medium transition-all ${
                  billing === 'yearly'
                    ? 'bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/30'
                    : 'text-[#6b7280] hover:text-white'
                }`}
              >
                Yearly <span className="text-[#10b981]">-20%</span>
              </button>
            </div>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan) => {
              const checkoutHref =
                plan.name === 'Enterprise' ? '/contact' : `/signup?plan=${plan.name.toLowerCase()}`;

              return (
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
                    <span className="text-4xl font-semibold text-white">
                      {displayPrice(plan.monthly, billing)}
                    </span>
                    <span className="text-sm text-[#6b7280]">
                      {plan.monthly === null ? '' : billing === 'monthly' ? '/mo' : '/yr'}
                    </span>
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
                    href={checkoutHref}
                    className={`block text-center px-4 py-3 text-sm font-medium transition-all ${
                      plan.mostPopular
                        ? 'border border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff]/10'
                        : 'border border-[#2a2a35] text-[#a0a0a8] hover:border-[#00d4ff]/50 hover:text-white'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
