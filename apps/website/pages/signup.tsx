import Head from 'next/head';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';

type Plan = 'free' | 'pro' | 'team' | 'enterprise';
type Billing = 'monthly' | 'yearly';

const PLAN_LABEL: Record<Plan, string> = {
  free: 'Free',
  pro: 'Pro',
  team: 'Team',
  enterprise: 'Enterprise',
};

export default function SignupPage() {
  const router = useRouter();

  const initialPlan = (router.query.plan as Plan) || 'pro';
  const initialBilling = (router.query.billing as Billing) || 'monthly';

  const [plan, setPlan] = useState<Plan>(initialPlan);
  const [billing, setBilling] = useState<Billing>(initialBilling);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const subtitle = useMemo(() => `${PLAN_LABEL[plan]} · ${billing}`, [plan, billing]);

  const beginCheckout = async (): Promise<void> => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, billing }),
      });

      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Checkout initialization failed');
      }

      window.location.href = data.url;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : 'Checkout failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-slate-950 text-white">
      <Head>
        <title>Sign Up - Ultra-Dex</title>
        <meta name="description" content="Create your Ultra-Dex workspace and start orchestration workflows." />
        <link rel="canonical" href="https://ultra-dex.dev/signup" />
      </Head>

      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-gray-700 bg-gray-900/60 p-6 shadow-xl">
          <h1 className="text-2xl font-bold">Create Your Workspace</h1>
          <p className="mt-1 text-sm text-gray-400">{subtitle}</p>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="text-sm text-gray-300">Plan</span>
              <select
                value={plan}
                onChange={(event) => setPlan(event.target.value as Plan)}
                className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm"
              >
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="team">Team</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm text-gray-300">Billing</span>
              <select
                value={billing}
                onChange={(event) => setBilling(event.target.value as Billing)}
                className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly (20% off)</option>
              </select>
            </label>
          </div>

          {error && (
            <p className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={beginCheckout}
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 font-semibold transition hover:from-blue-500 hover:to-purple-500 disabled:opacity-60"
          >
            {loading ? 'Preparing checkout…' : 'Continue'}
          </button>

          <p className="mt-3 text-xs text-gray-500">
            Enterprise plans route to sales automatically when self-serve checkout is not configured.
          </p>
        </div>
      </section>
    </div>
  );
}
