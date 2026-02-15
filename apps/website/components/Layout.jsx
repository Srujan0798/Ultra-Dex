import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { navLinks, siteName } from '../lib/site';

export default function Layout({ children, title = `${siteName} - AI Orchestration Meta-Layer` }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Head>
        <title>{title}</title>
        <meta
          content="Ultra-Dex orchestrates AI agents, memory, providers, and operations for production software teams."
          name="description"
        />
      </Head>

      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link className="text-lg font-semibold tracking-wide text-white" href="/">
            {siteName}
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                className="text-sm text-slate-300 transition hover:text-white"
                href={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              className="hidden rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-white md:inline-flex"
              href="https://github.com/Srujan0798/Ultra-Dex"
            >
              <span className="mr-1.5" aria-hidden>◐</span> GitHub
            </Link>
            <button
              aria-label="Toggle navigation"
              className="inline-flex rounded-md border border-slate-700 p-2 text-slate-300 md:hidden"
              onClick={() => setMobileOpen((previous) => !previous)}
              type="button"
            >
              <span aria-hidden>{mobileOpen ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-slate-800 px-4 py-3 md:hidden">
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  className="text-sm text-slate-300"
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer className="border-t border-slate-800 bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-xs text-slate-400 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
          <p>{siteName} © 2026. Built for production-grade AI orchestration.</p>
          <p>Security-first. Compliance-aware. Developer-native.</p>
        </div>
      </footer>
    </div>
  );
}
