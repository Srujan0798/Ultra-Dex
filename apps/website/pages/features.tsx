import Head from 'next/head';
import Link from 'next/link';
import { Terminal, Cpu, Activity, Shield, Database, Workflow, Zap, Code, Layers } from 'lucide-react';

export default function Features() {
  const features = [
    {
      title: 'DexGraph Engine',
      description: 'Deterministic workflow orchestration with DAG-based task graphs and state machines.',
      icon: <Workflow className="w-6 h-6" />,
      details: [
        'YAML-defined workflows',
        'Automatic dependency resolution',
        'Topological sorting',
        'Cycle detection',
        'State machine execution',
      ],
    },
    {
      title: 'Multi-Agent Control',
      description: 'Coordinate specialized agents with clear separation between orchestration and execution.',
      icon: <Cpu className="w-6 h-6" />,
      details: [
        'Planner, Coder, Tester, Reviewer',
        'Capability-based routing',
        'Stateless worker design',
        'Agent governance layer',
        'Execution adapter interface',
      ],
    },
    {
      title: 'Intelligent Routing',
      description: 'Route tasks to optimal providers based on cost, latency, and quality requirements.',
      icon: <Activity className="w-6 h-6" />,
      details: [
        '15+ AI providers supported',
        'Cost optimization',
        'Latency scoring',
        'Quality metrics',
        'Fallback chains',
      ],
    },
    {
      title: 'Persistent Memory',
      description: 'Three-tier memory system for episodic, semantic, and state storage.',
      icon: <Database className="w-6 h-6" />,
      details: [
        'Episodic task history',
        'Semantic vector search',
        'State checkpointing',
        'Graph knowledge storage',
        'Crash recovery',
      ],
    },
    {
      title: 'Governance Engine',
      description: 'Policy enforcement with rules that block, pause, or require review.',
      icon: <Shield className="w-6 h-6" />,
      details: [
        'Rule-based policies',
        'Block on violation',
        'Pause for review',
        'Audit logging',
        'Compliance tracking',
      ],
    },
    {
      title: 'CLI Interface',
      description: 'Command-line control plane for workflow management and monitoring.',
      icon: <Terminal className="w-6 h-6" />,
      details: [
        'ultradex run workflow.dex',
        'ultradex status',
        'ultradex inspect',
        'Rich terminal output',
        'Progress indicators',
      ],
    },
  ];

  return (
    <>
      <Head>
        <title>Features — Ultra-Dex</title>
        <meta name="description" content="Core features of Ultra-Dex workflow orchestration platform" />
      </Head>

      {/* Hero */}
      <section className="relative py-24 border-b border-[#2a2a35]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="text-xs font-mono text-[#00d4ff] uppercase tracking-widest mb-4">
              Features
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-white mb-6">
              Everything you need to{' '}
              <span className="text-gradient-cyan">orchestrate</span>
            </h1>
            <p className="text-xl text-[#6b7280] leading-relaxed">
              Ultra-Dex provides the infrastructure for deterministic, observable, 
              and scalable AI workflow orchestration.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative bg-[#141418] border border-[#2a2a35] hover:border-[#00d4ff]/30 transition-all p-8"
              >
                {/* Hover glow */}
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
                  <p className="text-[#6b7280] mb-6">
                    {feature.description}
                  </p>

                  {/* Details */}
                  <ul className="space-y-2">
                    {feature.details.map((detail) => (
                      <li key={detail} className="flex items-center gap-2 text-sm text-[#a0a0a8]">
                        <span className="w-1 h-1 rounded-full bg-[#00d4ff]" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture */}
      <section className="py-24 border-t border-[#2a2a35]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-xs font-mono text-[#00d4ff] uppercase tracking-widest mb-4">
                Architecture
              </div>
              <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-6">
                Built for scale, designed for control
              </h2>
              <p className="text-lg text-[#6b7280] mb-8 leading-relaxed">
                Ultra-Dex separates orchestration from execution. The control plane 
                decides WHAT happens, WHEN it happens, and WHO handles it. Execution 
                adapters handle the HOW.
              </p>
              
              <div className="space-y-4">
                {[
                  { title: 'Control Plane', desc: 'DexGraph, Scheduler, Governance' },
                  { title: 'Execution Layer', desc: 'Composio, Custom Adapters' },
                  { title: 'Memory Store', desc: 'Episodic, Semantic, State Tiers' },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 p-4 bg-[#141418] border border-[#2a2a35]">
                    <div className="w-2 h-2 rounded-full bg-[#00d4ff] mt-2" />
                    <div>
                      <div className="font-medium text-white">{item.title}</div>
                      <div className="text-sm text-[#6b7280]">{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Terminal Preview */}
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#00d4ff]/10 to-[#ff9900]/10 blur-2xl opacity-50" />
              <div className="relative bg-[#0a0a0c] border border-[#2a2a35] overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2a2a35] bg-[#141418]">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#27ca40]" />
                  <span className="ml-4 text-xs text-[#6b7280] font-mono">ultradex status</span>
                </div>
                <div className="p-6 font-mono text-sm">
                  <div className="text-[#6b7280] mb-2"># System Status</div>
                  <div className="flex items-center gap-2 text-[#10b981]">
                    <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                    <span>Core System: ONLINE</span>
                  </div>
                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-[#a0a0a8]">
                      <span>Active Agents:</span>
                      <span className="text-white">24</span>
                    </div>
                    <div className="flex justify-between text-[#a0a0a8]">
                      <span>Queue Length:</span>
                      <span className="text-white">187 tasks</span>
                    </div>
                    <div className="flex justify-between text-[#a0a0a8]">
                      <span>Latency p95:</span>
                      <span className="text-[#00d4ff]">42ms</span>
                    </div>
                    <div className="flex justify-between text-[#a0a0a8]">
                      <span>Success Rate:</span>
                      <span className="text-[#10b981]">98.4%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-[#2a2a35]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-semibold text-white mb-6">
            Ready to get started?
          </h2>
          <p className="text-lg text-[#6b7280] mb-8">
            Deploy Ultra-Dex and start orchestrating your AI workflows.
          </p>
          <Link
            href="/get-started"
            className="inline-flex items-center gap-2 px-8 py-4 text-sm font-medium border border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff]/10 hover:shadow-[0_0_30px_rgba(0,212,255,0.3)] transition-all"
          >
            Get Started
          </Link>
        </div>
      </section>
    </>
  );
}
