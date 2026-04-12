import Head from 'next/head';
import Link from 'next/link';
import { Terminal, Cpu, Activity, Zap, ArrowRight, Play } from 'lucide-react';

export default function Home() {
  const stats = [
    { value: '211K+', label: 'Lines Orchestrated', color: 'cyan' },
    { value: '31', label: 'Core Modules', color: 'amber' },
    { value: '152', label: 'CLI Commands', color: 'green' },
    { value: '18', label: 'Agent Types', color: 'purple' },
  ];

  const features = [
    {
      icon: <Terminal className="w-6 h-6" />,
      title: 'DexGraph Engine',
      description: 'Deterministic workflow orchestration with DAG-based task graphs. State machines ensure reliable execution from goal to completion.',
      highlights: ['YAML-defined workflows', 'Dependency resolution', 'Automatic retries'],
    },
    {
      icon: <Cpu className="w-6 h-6" />,
      title: 'Multi-Agent Control',
      description: 'Coordinate specialized agents with clear separation between orchestration and execution. Each agent knows its role.',
      highlights: ['4 core agent types', 'Capability routing', 'Stateless workers'],
    },
    {
      icon: <Activity className="w-6 h-6" />,
      title: 'Intelligent Routing',
      description: 'Route tasks to optimal providers based on cost, latency, and quality. Built-in fallback chains ensure reliability.',
      highlights: ['15+ AI providers', 'Cost optimization', 'Quality scoring'],
    },
  ];

  return (
    <>
      <Head>
        <title>Ultra-Dex — AI Workflow Control Plane</title>
        <meta name="description" content="Deterministic orchestration for AI agents. Build the brain, delegate the hands." />
        <meta name="keywords" content="AI orchestration, workflow engine, multi-agent, DexGraph" />
      </Head>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center border-b border-[#2a2a35] overflow-hidden">
        {/* Background Grid */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #00d4ff 1px, transparent 1px),
              linear-gradient(to bottom, #00d4ff 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />
        
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00d4ff]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#ff9900]/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
          <div className="max-w-4xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#00d4ff]/30 bg-[#00d4ff]/5 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-pulse" />
              <span className="text-xs font-mono text-[#00d4ff] uppercase tracking-wider">
                Now in v2.0
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-semibold text-white leading-[0.95] tracking-tight mb-8">
              AI Workflow
              <br />
              <span className="text-gradient-cyan">Control Plane</span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-[#a0a0a8] max-w-2xl mb-10 leading-relaxed">
              Ultra-Dex is a deterministic orchestration system that transforms high-level goals 
              into governed, multi-agent, verifiable workflows.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/get-started"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-medium border border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff]/10 hover:shadow-[0_0_30px_rgba(0,212,255,0.3)] transition-all group"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-medium border border-[#2a2a35] text-[#a0a0a8] hover:border-[#00d4ff]/50 hover:text-white transition-all"
              >
                <Play className="w-4 h-4" />
                <span>Watch Demo</span>
              </Link>
            </div>

            {/* Terminal Preview */}
            <div className="mt-16 relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#00d4ff]/20 via-transparent to-[#ff9900]/20 blur-xl" />
              <div className="relative bg-[#0a0a0c] border border-[#2a2a35] rounded-sm overflow-hidden">
                {/* Terminal Header */}
                <div className="flex items-center gap-2 px-4 py-2 border-b border-[#2a2a35] bg-[#141418]">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#27ca40]" />
                  <span className="ml-4 text-xs text-[#6b7280] font-mono">ultradex run workflow.dex</span>
                </div>
                {/* Terminal Content */}
                <div className="p-6 font-mono text-sm">
                  <div className="text-[#6b7280]"># Define your workflow</div>
                  <div className="mt-2">
                    <span className="text-[#00d4ff]">workflow</span>
                    <span className="text-white">:</span>
                  </div>
                  <div className="ml-4 text-white">
                    name: <span className="text-[#ff9900]">&quot;Build Feature&quot;</span>
                  </div>
                  <div className="ml-4 text-white">
                    steps:
                  </div>
                  <div className="ml-8">
                    <span className="text-[#a0a0a8]">- </span>
                    <span className="text-[#00d4ff]">planner</span>
                    <span className="text-[#a0a0a8]"> → </span>
                    <span className="text-[#6b7280]">architect</span>
                  </div>
                  <div className="ml-8">
                    <span className="text-[#a0a0a8]">- </span>
                    <span className="text-[#00d4ff]">architect</span>
                    <span className="text-[#a0a0a8]"> → </span>
                    <span className="text-[#6b7280]">coder</span>
                  </div>
                  <div className="ml-8">
                    <span className="text-[#a0a0a8]">- </span>
                    <span className="text-[#00d4ff]">coder</span>
                    <span className="text-[#a0a0a8]"> → </span>
                    <span className="text-[#6b7280]">tester</span>
                  </div>
                  <div className="mt-4 text-[#10b981]">✓ Workflow complete (2.4s)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 border-b border-[#2a2a35]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white tracking-tight">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm text-[#6b7280] font-mono uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="max-w-2xl mb-16">
            <div className="text-xs font-mono text-[#00d4ff] uppercase tracking-widest mb-4">
              Core Components
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-4">
              Everything you need to orchestrate AI workflows
            </h2>
            <p className="text-lg text-[#6b7280]">
              Built from the ground up for deterministic, observable, scalable AI operations.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="group relative bg-[#141418] border border-[#2a2a35] hover:border-[#00d4ff]/30 transition-all p-8"
              >
                {/* Glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#00d4ff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative">
                  {/* Icon */}
                  <div className="w-12 h-12 flex items-center justify-center border border-[#2a2a35] text-[#00d4ff] mb-6 group-hover:border-[#00d4ff]/50 group-hover:shadow-[0_0_20px_rgba(0,212,255,0.2)] transition-all">
                    {feature.icon}
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-semibold text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-[#6b7280] mb-6 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Highlights */}
                  <ul className="space-y-2">
                    {feature.highlights.map((highlight) => (
                      <li key={highlight} className="flex items-center gap-2 text-sm text-[#a0a0a8]">
                        <span className="w-1 h-1 rounded-full bg-[#00d4ff]" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-24 border-t border-[#2a2a35]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="text-xs font-mono text-[#00d4ff] uppercase tracking-widest mb-4">
              Philosophy
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">
              Build the brain. Delegate the hands.
            </h2>
            <p className="text-lg text-[#6b7280] leading-relaxed mb-8">
              Ultra-Dex is a control plane, not an agent framework. We orchestrate WHAT happens, 
              not HOW it happens. Execution layers like Composio plug into Ultra-Dex — not the other way around.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-[#141418] border border-[#2a2a35]">
                <Zap className="w-4 h-4 text-[#00d4ff]" />
                <span className="text-sm text-[#a0a0a8]">Deterministic execution</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-[#141418] border border-[#2a2a35]">
                <Activity className="w-4 h-4 text-[#00d4ff]" />
                <span className="text-sm text-[#a0a0a8]">Observable workflows</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 border-t border-[#2a2a35]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">
            Ready to orchestrate your AI workflows?
          </h2>
          <p className="text-lg text-[#6b7280] max-w-2xl mx-auto mb-10">
            Start building deterministic, multi-agent workflows with Ultra-Dex today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/get-started"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-medium border border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff]/10 hover:shadow-[0_0_30px_rgba(0,212,255,0.3)] transition-all"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-medium border border-[#2a2a35] text-[#a0a0a8] hover:border-[#00d4ff]/50 hover:text-white transition-all"
            >
              <span>Read Documentation</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
