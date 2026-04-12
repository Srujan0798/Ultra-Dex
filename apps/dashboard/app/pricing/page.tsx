import React from 'react';
import { Check, Zap, Shield, Crown, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';

export default function PricingPage() {
  const tiers = [
    {
      name: 'Free',
      price: '$0',
      description: 'Perfect for individual developers and hobbyists.',
      features: [
        'CLI Access',
        '3 AI Providers',
        'Basic Memory (L1/L2)',
        'Community Support',
        'Standard Routing',
      ],
      icon: Zap,
      cta: 'Get Started',
      variant: 'outline'
    },
    {
      name: 'Pro',
      price: '$29',
      description: 'Advanced features for power users and small teams.',
      features: [
        'All Free features',
        'Unlimited AI Providers',
        'Advanced Hybrid Routing',
        'Team Management (5 seats)',
        'Plugin Marketplace Access',
        'Email Support',
      ],
      icon: Crown,
      cta: 'Upgrade to Pro',
      variant: 'default',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      description: 'Mission-critical scale and security for organizations.',
      features: [
        'All Pro features',
        'SSO Authentication',
        'Full Audit Trail (SOC2)',
        '99.9% Uptime SLA',
        'Unlimited Seats',
        'Dedicated Support Manager',
        'Certification Program',
      ],
      icon: Shield,
      cta: 'Contact Sales',
      variant: 'outline'
    },
  ];

  return (
    <div className="space-y-16 py-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold tracking-tight">Simple, Transparent Pricing</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Choose the plan that fits your orchestration needs. Save 20% with annual billing.
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
          <span className="text-sm font-medium">Monthly</span>
          <div className="w-12 h-6 bg-primary/20 rounded-full relative p-1 cursor-pointer">
            <div className="w-4 h-4 bg-primary rounded-full absolute right-1 shadow-sm" />
          </div>
          <span className="text-sm font-medium">Annual</span>
          <span className="bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            Save 20%
          </span>
        </div>
      </div>

      {/* Tiers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto px-4">
        {tiers.map((tier) => (
          <Card key={tier.name} className={`relative flex flex-col ${tier.popular ? 'border-primary shadow-lg scale-105 z-10' : 'border-border'}`}>
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
                {tier.price !== 'Custom' && <span className="text-muted-foreground">/mo</span>}
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
              <Button variant={tier.variant as any} className="w-full h-12 text-md font-bold" size="lg">
                {tier.cta}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Comparison Section */}
      <div className="max-w-4xl mx-auto space-y-8">
        <h2 className="text-3xl font-bold text-center">Frequently Asked Questions</h2>
        <div className="grid gap-6">
          {[
            { q: 'Can I switch plans later?', a: 'Yes, you can upgrade or downgrade your plan at any time from your settings.' },
            { q: 'What providers are included?', a: 'Free includes OpenAI, Anthropic, and Google. Pro and Enterprise include NVIDIA, Mistral, and more.' },
            { q: 'Do you offer a trial for Pro?', a: 'Yes, every account starts with a 14-day free trial of our Pro features.' },
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
