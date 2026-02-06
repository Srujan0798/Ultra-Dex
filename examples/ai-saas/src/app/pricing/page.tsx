import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Check, Sparkles } from 'lucide-react';
import { PLANS } from '@/lib/stripe';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b">
        <div className="container flex h-14 items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Sparkles className="h-6 w-6" />
            <span className="font-bold">AI SaaS</span>
          </Link>
          <div className="ml-auto">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Pricing Section */}
      <section className="container py-24">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that works best for you. All plans include a 7-day free trial.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <Card key={plan.id} className={`flex flex-col ${plan.popular ? 'border-primary' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="mb-4">
                  <span className="text-4xl font-bold">
                    {plan.price === null ? 'Custom' : `$${plan.price}`}
                  </span>
                  {plan.price !== null && <span className="text-muted-foreground">/month</span>}
                </div>
                {plan.credits && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {plan.credits.toLocaleString()} credits included
                  </p>
                )}
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-1 shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant={plan.popular ? 'default' : 'outline'} asChild>
                  <Link
                    href={
                      plan.id === 'enterprise'
                        ? 'mailto:sales@example.com'
                        : `/auth/register?plan=${plan.id}`
                    }
                  >
                    {plan.id === 'enterprise' ? 'Contact Sales' : 'Get Started'}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">What are credits?</h3>
              <p className="text-muted-foreground">
                Credits are used when interacting with AI models. Each API call consumes credits
                based on the complexity and length of the request.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I upgrade or downgrade?</h3>
              <p className="text-muted-foreground">
                Yes, you can change your plan at any time. Changes take effect immediately, and
                we&apos;ll prorate any differences.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What happens if I run out of credits?</h3>
              <p className="text-muted-foreground">
                You can purchase additional credit packs or upgrade to a higher plan. Your service
                won&apos;t be interrupted.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
