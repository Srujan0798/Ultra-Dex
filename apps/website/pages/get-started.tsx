import Head from 'next/head';
import Link from 'next/link';
import { Terminal, ArrowRight, Copy, Check } from 'lucide-react';
import { useState } from 'react';

const STEPS = [
  {
    number: '01',
    title: 'Install CLI',
    description: 'Install Ultra-Dex globally via npm',
    code: 'npm install -g ultra-dex',
  },
  {
    number: '02',
    title: 'Configure Keys',
    description: 'Set up your AI provider API keys',
    code: 'ultradex config set-provider openai',
  },
  {
    number: '03',
    title: 'Initialize Project',
    description: 'Create your first Ultra-Dex project',
    code: 'ultradex init my-project',
  },
  {
    number: '04',
    title: 'Define Workflow',
    description: 'Create your first workflow file',
    code: 'ultradex workflow create',
  },
  {
    number: '05',
    title: 'Run & Monitor',
    description: 'Execute and monitor your workflow',
    code: 'ultradex run workflow.dex',
  },
];

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-[#0a0a0c] border border-[#2a2a35] p-4 font-mono text-sm">
      <div className="flex items-center gap-2 text-[#6b7280] mb-2">
        <Terminal className="w-4 h-4" />
        <span className="text-xs">terminal</span>
      </div>
      <code className="text-[#00d4ff]">{code}</code>
      <button
        onClick={copy}
        className="absolute top-4 right-4 p-2 text-[#6b7280] hover:text-white transition-colors"
      >
        {copied ? <Check className="w-4 h-4 text-[#10b981]" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function GetStarted() {
  return (
    <>
      <Head>
        <title>Get Started — Ultra-Dex</title>
        <meta name="description" content="Get started with Ultra-Dex in 5 minutes" />
      </Head>

      {/* Hero */}
      <section className="py-24 border-b border-[#2a2a35]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="text-xs font-mono text-[#00d4ff] uppercase tracking-widest mb-4">
              Get Started
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold text-white mb-6">
              Deploy in 5 minutes
            </h1>
            <p className="text-lg text-[#6b7280] leading-relaxed">
              Get from zero to production-ready AI orchestration in five simple steps.
            </p>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {STEPS.map((step, index) => (
              <div
                key={step.number}
                className="group bg-[#141418] border border-[#2a2a35] hover:border-[#00d4ff]/30 transition-all"
              >
                <div className="p-8">
                  {/* Header */}
                  <div className="flex items-start gap-6 mb-6">
                    <div className="text-4xl font-mono font-semibold text-[#2a2a35] group-hover:text-[#00d4ff]/30 transition-colors">
                      {step.number}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                      <p className="text-[#6b7280]">{step.description}</p>
                    </div>
                  </div>

                  {/* Code */}
                  <CodeBlock code={step.code} />
                </div>
              </div>
            ))}
          </div>

          {/* Next Steps */}
          <div className="mt-16 text-center">
            <h2 className="text-2xl font-semibold text-white mb-6">What's next?</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 px-8 py-4 text-sm font-medium border border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff]/10 transition-all"
              >
                Read Documentation
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 px-8 py-4 text-sm font-medium border border-[#2a2a35] text-[#a0a0a8] hover:border-[#00d4ff]/50 hover:text-white transition-all"
              >
                Try Demo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
