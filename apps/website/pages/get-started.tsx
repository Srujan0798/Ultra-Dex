import Head from 'next/head';
import Link from 'next/link';

const STEPS = [
  'Install Ultra-Dex CLI and verify environment.',
  'Connect one AI provider key (OpenAI, Anthropic, or Gemini).',
  'Run the interactive tutorial to create your first agent.',
  'Open dashboard and verify memory + orchestration pipeline.',
  'Enable GitHub workflow integration for PR automation.',
];

export default function GetStartedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-900 text-white">
      <Head>
        <title>Get Started with Ultra-Dex</title>
        <meta
          name="description"
          content="Launch Ultra-Dex in minutes: install, configure providers, create your first agent, and deploy workflows."
        />
        <link rel="canonical" href="https://ultra-dex.dev/get-started" />
      </Head>

      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold">Get Started in 5 Steps</h1>
          <p className="mt-3 text-gray-300">
            This sequence gets a team from zero setup to production-safe workflows quickly.
          </p>

          <ol className="mt-8 space-y-4">
            {STEPS.map((step, index) => (
              <li key={step} className="rounded-xl border border-gray-700 bg-gray-900/60 p-4">
                <p className="text-sm font-semibold text-blue-300">Step {index + 1}</p>
                <p className="mt-1 text-sm text-gray-200">{step}</p>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/demo"
              className="rounded-lg border border-gray-700 px-5 py-2 font-medium text-gray-200 hover:border-blue-500"
            >
              Try Interactive Demo
            </Link>
            <Link
              href="/pricing"
              className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2 font-semibold text-white hover:from-blue-500 hover:to-purple-500"
            >
              Choose a Plan
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
