import Head from 'next/head';
import Link from 'next/link';
import { InteractiveDemo } from '../components/InteractiveDemo';

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-gray-950 text-white">
      <Head>
        <title>Ultra-Dex Interactive Demo</title>
        <meta
          name="description"
          content="Try Ultra-Dex orchestration scenarios in-browser with no signup required."
        />
        <link rel="canonical" href="https://ultra-dex.dev/demo" />
      </Head>

      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold md:text-5xl">Interactive Product Demo</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
            Experience orchestration workflows, model routing, and memory-aware output before creating an account.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-5xl">
          <InteractiveDemo />
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/signup?plan=pro&billing=monthly"
            className="inline-block rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-semibold text-white hover:from-blue-500 hover:to-purple-500"
          >
            Continue to Pro Trial
          </Link>
        </div>
      </section>
    </div>
  );
}
