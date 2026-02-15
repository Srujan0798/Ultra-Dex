import Head from 'next/head';
import Link from 'next/link';
import { useMemo, useState } from 'react';

type Billing = 'monthly' | 'yearly';

type Plan = {
  name: 'Free' | 'Pro' | 'Team' | 'Enterprise';
  monthly: number | null;
  description: string;
  features: string[];
  cta: string;
  mostPopular?: boolean;
};

const PLANS: Plan[] = [
  {
    name: 'Free',
    monthly: 0,
    description: 'Perfect for individuals getting started',
    features: ['1 agent', '100 requests/month', 'Basic memory', 'Community support'],
    cta: 'Start Free',
  },
  {
    name: 'Pro',
    monthly: 49,
    description: 'For professionals and small teams',
    features: [
      '10 agents',
      'Unlimited requests',
      'Advanced memory',
      'Priority support',
      'API access',
    ],
    cta: 'Start Pro Trial',
    mostPopular: true,
  },
  {
    name: 'Team',
    monthly: 199,
    description: 'For growing teams and departments',
    features: ['50 agents', 'Team workspaces', 'SLA guarantees', 'Advanced analytics', 'SSO add-on'],
    cta: 'Start Team Trial',
  },
  {
    name: 'Enterprise',
    monthly: null,
    description: 'For large organizations with governance requirements',
    features: ['Unlimited agents', 'Private deployment', 'Compliance support', 'Dedicated success engineer'],
    cta: 'Contact Sales',
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

  const subtitle = useMemo(
    () => (billing === 'monthly' ? 'Billed monthly' : 'Billed yearly (20% off)'),
    [billing]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <Head>
        <title>Ultra-Dex Pricing | Flexible Plans for Every Team</title>
        <meta
          name="description"
          content="Transparent pricing for Ultra-Dex orchestration. Start free, scale with Pro and Team, and deploy enterprise-grade workflows."
        />
        <link rel="canonical" href="https://ultra-dex.dev/pricing" />
      </Head>

      <section className="py-20">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold md:text-5xl">
              Simple, <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Transparent</span> Pricing
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
              Choose a plan that fits your team. Switch anytime without migration pain.
            </p>
          </div>

          <div className="mx-auto mt-8 flex w-fit items-center rounded-full border border-gray-700 bg-gray-900/70 p-1">
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-sm ${billing === 'monthly' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
              onClick={() => setBilling('monthly')}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-sm ${billing === 'yearly' ? 'bg-blue-600 text-white' : 'text-gray-300'}`}
              onClick={() => setBilling('yearly')}
            >
              Yearly (20% off)
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-gray-400">{subtitle}</p>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan) => {
              const billingParam = billing;
              const planParam = plan.name.toLowerCase();
              const checkoutHref =
                plan.name === 'Enterprise'
                  ? '/contact'
                  : `/signup?plan=${planParam}&billing=${billingParam}`;

              return (
                <article
                  key={plan.name}
                  className={`relative rounded-2xl border p-8 ${
                    plan.mostPopular
                      ? 'border-blue-500 bg-gradient-to-b from-gray-800 to-gray-900 ring-2 ring-blue-500/20'
                      : 'border-gray-700 bg-gray-800/50'
                  }`}
                >
                  {plan.mostPopular && (
                    <p className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-blue-500 px-5 py-1 text-xs font-semibold text-white">
                      Most Popular
                    </p>
                  )}

                  <h2 className="text-2xl font-bold">{plan.name}</h2>
                  <p className="mt-2 text-sm text-gray-400">{plan.description}</p>
                  <p className="mt-4 text-4xl font-bold">{displayPrice(plan.monthly, billing)}</p>
                  <p className="text-sm text-gray-400">
                    {plan.monthly === null ? 'Custom contract' : billing === 'monthly' ? '/month' : '/year'}
                  </p>

                  <ul className="mt-6 space-y-3 text-sm text-gray-200">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <span className="mt-0.5 text-green-400">✓</span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={checkoutHref}
                    className={`mt-8 block rounded-lg px-4 py-2 text-center font-semibold transition ${
                      plan.mostPopular
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
