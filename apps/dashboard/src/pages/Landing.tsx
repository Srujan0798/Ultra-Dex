import { memo } from 'react';
import { Link } from 'react-router-dom';

const features = [
  'Multi-Provider Routing',
  'Agent Swarms',
  'Persistent Memory',
  'MCP Ecosystem',
  'Governance',
  'Distributed Mesh',
];

const pricing = [
  { plan: 'Free', price: '$0' },
  { plan: 'Pro', price: '$29/mo' },
  { plan: 'Enterprise', price: '$99/mo' },
];

export const Landing = memo(function Landing() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 text-center">
        <h1 className="text-5xl font-bold tracking-tight">AI Orchestration. Done Right.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-300">
          Run multi-agent workflows across providers with governance, memory, and production-grade
          observability.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/login"
            className="rounded-lg bg-emerald-600 px-5 py-3 font-medium text-white transition hover:bg-emerald-500"
          >
            Get Started Free
          </Link>
          <a
            href="https://github.com/Srujan0798/Ultra-Dex"
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-slate-700 px-5 py-3 font-medium text-slate-100 transition hover:border-slate-500"
          >
            View GitHub
          </a>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <article key={feature} className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-base font-semibold">{feature}</h2>
          </article>
        ))}
      </section>

      <section className="mx-auto mt-14 max-w-6xl px-6 pb-16">
        <h2 className="mb-4 text-2xl font-semibold">Pricing</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {pricing.map((tier) => (
            <article
              key={tier.plan}
              className="rounded-xl border border-slate-800 bg-slate-900/70 p-6"
            >
              <div className="text-sm text-slate-400">{tier.plan}</div>
              <div className="mt-2 text-3xl font-bold">{tier.price}</div>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-800 px-6 py-6 text-center text-sm text-slate-400">
        <a
          href="https://github.com/Srujan0798/Ultra-Dex"
          target="_blank"
          rel="noreferrer"
          className="mr-4 hover:text-slate-200"
        >
          GitHub
        </a>
        <a
          href="https://github.com/Srujan0798/Ultra-Dex/tree/main/docs"
          target="_blank"
          rel="noreferrer"
          className="hover:text-slate-200"
        >
          Docs
        </a>
      </footer>
    </main>
  );
});
