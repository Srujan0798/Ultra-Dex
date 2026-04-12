import Head from 'next/head';
import { Terminal, Zap, Globe, Cpu, Activity, Shield } from 'lucide-react';

const VALUES = [
  {
    icon: <Terminal className="w-6 h-6" />,
    title: 'Control First',
    description: 'Ultra-Dex is a control plane, not an agent framework. We orchestrate WHAT happens, not HOW.',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Deterministic',
    description: 'Workflows execute predictably. Same input, same output, every time.',
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: 'Pluggable',
    description: 'Execution adapters plug into Ultra-Dex. Use Composio, custom tools, or any provider.',
  },
];

const TECH = [
  {
    icon: <Cpu className="w-5 h-5" />,
    title: 'DexGraph',
    description: 'DAG-based workflow engine with state machines',
  },
  {
    icon: <Activity className="w-5 h-5" />,
    title: 'Memory Store',
    description: 'Episodic, semantic, and state persistence tiers',
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Governance',
    description: 'Policy enforcement with rules that block or pause',
  },
];

export default function About() {
  return (
    <>
      <Head>
        <title>About — Ultra-Dex</title>
        <meta name="description" content="The mission behind Ultra-Dex workflow orchestration" />
      </Head>

      {/* Hero */}
      <section className="py-24 border-b border-[#2a2a35]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="text-xs font-mono text-[#00d4ff] uppercase tracking-widest mb-4">
              About
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold text-white mb-6">
              Build the brain.
              <br />
              Delegate the hands.
            </h1>
            <p className="text-lg text-[#6b7280] leading-relaxed">
              Ultra-Dex is a deterministic, stateful orchestration control plane that transforms 
              high-level goals into governed, multi-agent, verifiable workflows.
            </p>
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-2xl font-semibold text-white mb-6">The Problem</h2>
              <p className="text-[#6b7280] mb-6 leading-relaxed">
                AI tools today are fragmented. Each session starts fresh. Each tool works in isolation. 
                Building production AI applications requires coordination, memory, and governance that 
                existing platforms don't provide.
              </p>
              <p className="text-[#6b7280] leading-relaxed">
                Developers spend more time wiring together tools than building value. Agents lose context. 
                Workflows fail silently. Costs spiral unpredictably.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white mb-6">Our Solution</h2>
              <p className="text-[#6b7280] mb-6 leading-relaxed">
                Ultra-Dex provides the control plane infrastructure for AI workflows. We separate 
                orchestration from execution, giving you deterministic control over what happens, 
                when it happens, and who handles it.
              </p>
              <p className="text-[#6b7280] leading-relaxed">
                Execution layers plug into Ultra-Dex. You decide WHAT. They decide HOW. The result: 
                predictable, observable, governable AI workflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 border-t border-[#2a2a35]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-xs font-mono text-[#00d4ff] uppercase tracking-widest mb-4">
            Values
          </div>
          <h2 className="text-3xl font-semibold text-white mb-12">How we build</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VALUES.map((value) => (
              <div
                key={value.title}
                className="group bg-[#141418] border border-[#2a2a35] hover:border-[#00d4ff]/30 transition-all p-8"
              >
                <div className="w-12 h-12 flex items-center justify-center border border-[#2a2a35] text-[#00d4ff] mb-6 group-hover:border-[#00d4ff]/50 group-hover:shadow-[0_0_20px_rgba(0,212,255,0.2)] transition-all">
                  {value.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">{value.title}</h3>
                <p className="text-sm text-[#6b7280] leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology */}
      <section className="py-24 border-t border-[#2a2a35]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-xs font-mono text-[#00d4ff] uppercase tracking-widest mb-4">
            Technology
          </div>
          <h2 className="text-3xl font-semibold text-white mb-12">Core components</h2>

          <div className="space-y-4">
            {TECH.map((tech) => (
              <div
                key={tech.title}
                className="flex items-start gap-6 p-6 bg-[#141418] border border-[#2a2a35]"
              >
                <div className="w-10 h-10 flex items-center justify-center border border-[#2a2a35] text-[#00d4ff] shrink-0">
                  {tech.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{tech.title}</h3>
                  <p className="text-sm text-[#6b7280]">{tech.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
