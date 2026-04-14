'use client';

import React, { useState } from 'react';
import { Check, Zap, Shield, Crown, Users, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';

const tiers = [
  {
    id: 'free',
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
    icon: Zap,
    cta: 'Get Started',
    variant: 'outline' as const,
  },
  {
    id: 'pro',
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
    icon: Crown,
    cta: 'Start Pro',
    variant: 'default' as const,
    popular: true,
  },
  {
    id: 'dexgraph',
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
    icon: Users,
    cta: 'Coming Soon',
    variant: 'outline' as const,
    disabled: true,
  },
  {
    id: 'enterprise',
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
    icon: Shield,
    cta: 'Contact Sales',
    variant: 'outline' as const,
    href: 'mailto:sales@ultra-dex.dev',
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCheckout(tierId: string) {
    if (tierId === 'free' || tierId === 'enterprise') return;
    setLoading(tierId);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId,
          userId: 'user_demo',
          email: 'demo@ultra-dex.dev',
          name: 'Demo User',
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Checkout failed');
        setLoading(null);
      }
    } catch (err) {
      alert('Checkout failed');
      setLoading(null);
    }
  }

  return (
    <div className="space-y-16 py-8 px-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold tracking-tight">Simple, Transparent Pricing</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Start free with the SDK. Upgrade when you need cloud analytics and orchestration.
        </p>
      </div>

      {/* Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {tiers.map((tier) => (
          <Card
            key={tier.name}
            className={`relative flex flex-col ${
              tier.popular ? 'border-primary shadow-lg scale-105 z-10' : 'border-border'
            }`}
          >
            {tier.popular && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                Most Popular
              </div>
            )}
            <CardHeader>
              <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                <tier.icon className="text-primary" size={24} />
              </div>
              <CardTitle className="text-2xl">{tier.name}</CardTitle>
              <CardDescription>{tier.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-6">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">{tier.price}</span>
                <span className="text-muted-foreground">{tier.priceLabel}</span>
              </div>
              <ul className="space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="text-primary mt-0.5 shrink-0" size={16} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {tier.href ? (
                <a href={tier.href} className="w-full">
                  <Button variant={tier.variant} className="w-full h-12 text-md font-bold" size="lg">
                    {tier.cta}
                  </Button>
                </a>
              ) : (
                <Button
                  variant={tier.variant}
                  className="w-full h-12 text-md font-bold"
                  size="lg"
                  disabled={tier.disabled || loading === tier.id}
                  onClick={() => handleCheckout(tier.id)}
                >
                  {loading === tier.id ? 'Loading...' : tier.cta}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto space-y-8">
        <h2 className="text-3xl font-bold text-center">Frequently Asked Questions</h2>
        <div className="grid gap-6">
          {[
            { q: 'Can I switch plans later?', a: 'Yes, you can upgrade or downgrade your plan at any time from your billing settings.' },
            { q: 'What providers are included?', a: 'All plans include access to all provider adapters. The difference is in analytics, orchestration, and team features.' },
            { q: 'Do you offer a trial for Pro?', a: 'Yes, every new account starts with a 14-day free trial of Pro Dashboard features.' },
          ].map((faq, i) => (
            <div key={i} className="space-y-2 p-6 bg-card border border-border rounded-xl">
              <h3 className="font-bold flex items-center gap-2">
                <HelpCircle size={18} className="text-primary" />
                {faq.q}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
