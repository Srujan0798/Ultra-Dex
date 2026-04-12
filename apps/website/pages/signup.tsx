import Head from 'next/head';
import { useState } from 'react';
import { Terminal, ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';

type Plan = 'free' | 'pro' | 'team';
type Billing = 'monthly' | 'yearly';

const PLANS: Record<Plan, { name: string; price: number; features: string[] }> = {
  free: {
    name: 'Free',
    price: 0,
    features: ['1 agent', '100 requests/month', 'Community support'],
  },
  pro: {
    name: 'Pro',
    price: 49,
    features: ['10 agents', 'Unlimited requests', 'Priority support', 'API access'],
  },
  team: {
    name: 'Team',
    price: 199,
    features: ['50 agents', 'Team workspaces', 'SLA guarantees', 'SSO'],
  },
};

export default function Signup() {
  const [plan, setPlan] = useState<Plan>('pro');
  const [billing, setBilling] = useState<Billing>('monthly');
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'plan' | 'account'>('plan');

  const price = billing === 'yearly' ? Math.round(PLANS[plan].price * 12 * 0.8) : PLANS[plan].price;

  return (
    <>
      <Head>
        <title>Sign Up — Ultra-Dex</title>
        <meta name="description" content="Create your Ultra-Dex account" />
      </Head>

      <div className="min-h-screen flex items-center justify-center py-24">
        <div className="max-w-xl w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#141418] border border-[#2a2a35] p-8">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
              <Terminal className="w-5 h-5 text-[#00d4ff]" />
              <span className="text-sm font-mono text-[#00d4ff] uppercase">Create Account</span>
            </div>

            {step === 'plan' ? (
              <>
                {/* Plan Selection */}
                <h1 className="text-2xl font-semibold text-white mb-2">Choose your plan</h1>
                <p className="text-[#6b7280] mb-6">Start free or upgrade for more power.</p>

                {/* Billing Toggle */}
                <div className="flex gap-1 p-1 bg-[#0a0a0c] border border-[#2a2a35] mb-6">
                  <button
                    onClick={() => setBilling('monthly')}
                    className={`flex-1 py-2 text-sm font-medium transition-all ${
                      billing === 'monthly'
                        ? 'bg-[#2a2a35] text-white'
                        : 'text-[#6b7280] hover:text-white'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBilling('yearly')}
                    className={`flex-1 py-2 text-sm font-medium transition-all ${
                      billing === 'yearly'
                        ? 'bg-[#2a2a35] text-white'
                        : 'text-[#6b7280] hover:text-white'
                    }`}
                  >
                    Yearly <span className="text-[#10b981]">-20%</span>
                  </button>
                </div>

                {/* Plans */}
                <div className="space-y-3 mb-6">
                  {(Object.keys(PLANS) as Plan[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlan(p)}
                      className={`w-full flex items-center justify-between p-4 border transition-all ${
                        plan === p
                          ? 'border-[#00d4ff] bg-[#00d4ff]/5'
                          : 'border-[#2a2a35] hover:border-[#00d4ff]/30'
                      }`}
                    >
                      <div className="text-left">
                        <div className="font-medium text-white">{PLANS[p].name}</div>
                        <div className="text-sm text-[#6b7280]">
                          {p === 'free' ? 'Free forever' : `$${PLANS[p].price}/mo`}
                        </div>
                      </div>
                      {plan === p && (
                        <div className="w-5 h-5 border border-[#00d4ff] flex items-center justify-center">
                          <div className="w-2.5 h-2.5 bg-[#00d4ff]" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Features */}
                <div className="bg-[#0a0a0c] border border-[#2a2a35] p-4 mb-6">
                  <div className="text-sm text-[#6b7280] mb-2">Included:</div>
                  <ul className="space-y-2">
                    {PLANS[plan].features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-[#a0a0a8]">
                        <Check className="w-4 h-4 text-[#00d4ff]" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => setStep('account')}
                  className="w-full flex items-center justify-center gap-2 py-4 border border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff]/10 transition-all"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                {/* Account Creation */}
                <h1 className="text-2xl font-semibold text-white mb-2">Create your account</h1>
                <p className="text-[#6b7280] mb-6">
                  {PLANS[plan].name} plan • {billing === 'yearly' ? 'Yearly' : 'Monthly'}
                </p>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm text-[#6b7280] mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-[#0a0a0c] border border-[#2a2a35] text-white placeholder:text-[#6b7280] focus:border-[#00d4ff] outline-none transition-colors"
                      placeholder="you@company.com"
                    />
                  </div>
                </div>

                <button className="w-full flex items-center justify-center gap-2 py-4 border border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff]/10 transition-all mb-4">
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setStep('plan')}
                  className="w-full py-2 text-sm text-[#6b7280] hover:text-white transition-colors"
                >
                  Back to plans
                </button>
              </>
            )}

            {/* Sign In Link */}
            <div className="mt-6 pt-6 border-t border-[#2a2a35] text-center">
              <span className="text-sm text-[#6b7280]">Already have an account? </span>
              <Link href="/login" className="text-sm text-[#00d4ff] hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
