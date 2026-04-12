import Head from 'next/head';
import Link from 'next/link';
import { ReactNode } from 'react';
import { Terminal, Zap, Cpu, Activity } from 'lucide-react';

type LayoutProps = {
  children: ReactNode;
  title?: string;
  description?: string;
  keywords?: string;
};

export default function Layout({
  children,
  title = 'Ultra-Dex',
  description = 'Deterministic AI Workflow Orchestration',
  keywords = 'AI orchestration, workflow engine, multi-agent, control plane'
}: LayoutProps) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href={`https://ultra-dex.dev`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ultra-dex.dev" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://ultra-dex.dev" />
        <meta property="twitter:title" content={title} />
        <meta property="twitter:description" content={description} />
      </Head>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#0a0a0c]/95 backdrop-blur-md border-b border-[#2a2a35]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-[#00d4ff] to-[#6b21a8] flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-shadow">
                <Terminal size={18} className="text-[#0a0a0c]" />
              </div>
              <div>
                <span className="text-xl font-semibold text-white tracking-tight">
                  Ultra-Dex
                </span>
                <span className="ml-2 text-[10px] font-mono text-[#00d4ff] bg-[#00d4ff]/10 px-1.5 py-0.5 rounded">
                  v2.0
                </span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {[
                { href: '/', label: 'Overview' },
                { href: '/features', label: 'Features' },
                { href: '/docs', label: 'Docs' },
                { href: '/pricing', label: 'Pricing' },
                { href: '/enterprise', label: 'Enterprise' },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-[#a0a0a8] hover:text-white transition-colors font-medium"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="hidden md:block text-sm text-[#a0a0a8] hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/get-started"
                className="px-4 py-2 text-sm font-medium border border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff]/10 hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-[#0a0a0c] border-t border-[#2a2a35] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded bg-gradient-to-br from-[#00d4ff] to-[#6b21a8] flex items-center justify-center">
                  <Terminal size={18} className="text-[#0a0a0c]" />
                </div>
                <span className="text-xl font-semibold text-white">Ultra-Dex</span>
              </div>
              <p className="text-sm text-[#6b7280] leading-relaxed">
                Deterministic workflow orchestration for AI agents. Build the brain, delegate the hands.
              </p>
              <div className="flex items-center gap-2 mt-4">
                <span className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_8px_#10b981] animate-pulse" />
                <span className="text-xs text-[#6b7280] font-mono">All systems operational</span>
              </div>
            </div>

            {/* Links */}
            <div>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Product</h3>
              <ul className="space-y-3">
                {['Features', 'Pricing', 'Docs', 'API'].map((item) => (
                  <li key={item}>
                    <Link
                      href={`/${item.toLowerCase()}`}
                      className="text-sm text-[#6b7280] hover:text-[#00d4ff] transition-colors"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Company</h3>
              <ul className="space-y-3">
                {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                  <li key={item}>
                    <Link
                      href={`/${item.toLowerCase()}`}
                      className="text-sm text-[#6b7280] hover:text-[#00d4ff] transition-colors"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Connect</h3>
              <ul className="space-y-3">
                {[
                  { label: 'GitHub', href: 'https://github.com/Srujan0798/Ultra-Dex' },
                  { label: 'Twitter', href: '#' },
                  { label: 'Discord', href: '#' },
                ].map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-sm text-[#6b7280] hover:text-[#00d4ff] transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-[#2a2a35] mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-[#6b7280]">
              &copy; {new Date().getFullYear()} Ultra-Dex. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/terms" className="text-sm text-[#6b7280] hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="text-sm text-[#6b7280] hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/security" className="text-sm text-[#6b7280] hover:text-white transition-colors">
                Security
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
