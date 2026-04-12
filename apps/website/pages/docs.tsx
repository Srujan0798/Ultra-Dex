import Head from 'next/head';
import Link from 'next/link';
import { Terminal, Cpu, Activity, Shield, Book, Code, ArrowRight } from 'lucide-react';

const SECTIONS = [
  {
    icon: <Book className="w-5 h-5" />,
    title: 'Getting Started',
    items: [
      { name: 'Quick Start', href: '#', desc: '5 minute setup' },
      { name: 'Installation', href: '#', desc: 'CLI & dependencies' },
      { name: 'Configuration', href: '#', desc: 'API keys & settings' },
    ],
  },
  {
    icon: <Cpu className="w-5 h-5" />,
    title: 'Core Concepts',
    items: [
      { name: 'DexGraph', href: '#', desc: 'DAG-based workflows' },
      { name: 'Agents', href: '#', desc: 'Worker architecture' },
      { name: 'Memory', href: '#', desc: 'Three-tier storage' },
    ],
  },
  {
    icon: <Terminal className="w-5 h-5" />,
    title: 'CLI Reference',
    items: [
      { name: 'Commands', href: '#', desc: '152 CLI commands' },
      { name: 'Workflows', href: '#', desc: 'Define & run' },
      { name: 'Monitoring', href: '#', desc: 'Status & logs' },
    ],
  },
  {
    icon: <Code className="w-5 h-5" />,
    title: 'API Reference',
    items: [
      { name: 'REST API', href: '#', desc: 'HTTP endpoints' },
      { name: 'WebSocket', href: '#', desc: 'Real-time events' },
      { name: 'SDKs', href: '#', desc: 'JavaScript & Python' },
    ],
  },
];

export default function Docs() {
  return (
    <>
      <Head>
        <title>Documentation — Ultra-Dex</title>
        <meta name="description" content="Complete Ultra-Dex documentation" />
      </Head>

      {/* Hero */}
      <section className="py-24 border-b border-[#2a2a35]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="text-xs font-mono text-[#00d4ff] uppercase tracking-widest mb-4">
              Documentation
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold text-white mb-6">
              Everything you need to know
            </h1>
            <p className="text-lg text-[#6b7280]">
              Guides, API references, and examples to help you build with Ultra-Dex.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#141418] border border-[#2a2a35] p-8 mb-16">
            <div className="flex items-center gap-2 mb-4">
              <Terminal className="w-4 h-4 text-[#00d4ff]" />
              <span className="text-xs font-mono text-[#00d4ff] uppercase">Quick Start</span>
            </div>
            <p className="text-[#6b7280] mb-4">Install Ultra-Dex and run your first workflow:</p>
            <div className="bg-[#0a0a0c] border border-[#2a2a35] p-4 font-mono text-sm">
              <div className="text-[#6b7280] mb-2"># Install CLI</div>
              <div className="text-[#00d4ff]">npm install -g ultra-dex</div>
              <div className="text-[#6b7280] my-2"># Initialize project</div>
              <div className="text-[#00d4ff]">ultradex init my-project</div>
              <div className="text-[#6b7280] my-2"># Run workflow</div>
              <div className="text-[#00d4ff]">ultradex run workflow.dex</div>
            </div>
          </div>

          {/* Doc Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {SECTIONS.map((section) => (
              <div
                key={section.title}
                className="bg-[#141418] border border-[#2a2a35] p-8 hover:border-[#00d4ff]/30 transition-all"
              >
                <div className="w-10 h-10 flex items-center justify-center border border-[#2a2a35] text-[#00d4ff] mb-6">
                  {section.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-4">{section.title}</h3>
                <ul className="space-y-3">
                  {section.items.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="flex items-center justify-between group"
                      >
                        <div>
                          <div className="text-[#a0a0a8] group-hover:text-white transition-colors">
                            {item.name}
                          </div>
                          <div className="text-xs text-[#6b7280]">{item.desc}</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#2a2a35] group-hover:text-[#00d4ff] transition-colors" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
