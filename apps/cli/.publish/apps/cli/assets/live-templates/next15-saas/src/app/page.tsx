/**
 * @fileoverview Page module
 * @module app/page
 */

import Link from 'next/link';
import { SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { auth } from '@clerk/nextjs/server';

export default async function Home() {
  const { userId } = await auth();

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold">SaaS Name</h1>
        <div className="flex gap-4">
          {userId ? (
            <>
              <Link href="/dashboard" className="px-4 py-2 rounded bg-primary hover:bg-primary/90">
                Dashboard
              </Link>
              <UserButton />
            </>
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="px-4 py-2 rounded border border-white/20 hover:bg-white/10">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-4 py-2 rounded bg-primary hover:bg-primary/90">
                  Get Started
                </button>
              </SignUpButton>
            </>
          )}
        </div>
      </nav>

      <section className="max-w-4xl mx-auto text-center py-32 px-6">
        <h2 className="text-5xl font-bold mb-6">Build Your SaaS in Record Time</h2>
        <p className="text-xl text-gray-400 mb-12">
          A production-ready template with authentication, payments, and more.
        </p>
        <div className="flex gap-4 justify-center">
          <SignUpButton mode="modal">
            <button className="px-8 py-4 rounded-lg bg-primary hover:bg-primary/90 text-lg font-semibold">
              Start Free Trial
            </button>
          </SignUpButton>
          <Link
            href="#pricing"
            className="px-8 py-4 rounded-lg border border-white/20 hover:bg-white/10 text-lg"
          >
            View Pricing
          </Link>
        </div>
      </section>
    </main>
  );
}

/**
 * Error handler for page
 * @param {Error} error - Error to handle
 */
function handlePageError(error) {
  try {
    console.error('[page]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
