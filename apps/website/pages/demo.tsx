import Head from 'next/head';
import Link from 'next/link';
import { Terminal, Play, ArrowRight, Activity, Cpu, CheckCircle } from 'lucide-react';

const STEPS = [
  { step: 1, title: 'Parse', desc: 'Workflow DSL → Graph', status: 'complete' },
  { step: 2, title: 'Schedule', desc: 'Topological ordering', status: 'complete' },
  { step: 3, title: 'Dispatch', desc: 'Agent assignment', status: 'running' },
  { step: 4, title: 'Verify', desc: 'Output validation', status: 'pending' },
];

export default function Demo() {
  return (
    <>
      <Head>
        <title>Demo — Ultra-Dex</title>
        <meta name="description" content="See Ultra-Dex in action" />
      </Head>

      {/* Hero */}
      <section className="py-24 border-b border-[#2a2a35]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="text-xs font-mono text-[#00d4ff] uppercase tracking-widest mb-4">
              Interactive Demo
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold text-white mb-6">
              See it in action
            </h1>
            <p className="text-lg text-[#6b7280]">
              Watch Ultra-Dex orchestrate a workflow in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* Demo Interface */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Workflow Definition */}
            <div className="lg:col-span-1">
              <div className="bg-[#141418] border border-[#2a2a35] p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Terminal className="w-4 h-4 text-[#00d4ff]" />
                  <span className="text-xs font-mono text-[#00d4ff] uppercase">Workflow</span>
                </div>
                <div className="bg-[#0a0a0c] border border-[#2a2a35] p-4 font-mono text-sm">
                  <div className="text-[#6b7280]"># build-feature.dex</div>
                  <div className="text-[#00d4ff] mt-2">workflow:</div>
                  <div className="ml-4 text-white">name: <span className="text-[#ff9900]">"Build Feature"</span></div>
                  <div className="ml-4 text-white">steps:</div>
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
                </div>
              </div>

              {/* Progress */}
              <div className="bg-[#141418] border border-[#2a2a35] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-[#00d4ff]" />
                  <span className="text-xs font-mono text-[#00d4ff] uppercase">Progress</span>
                </div>
                <div className="space-y-4">
                  {STEPS.map((s) => (
                    <div key={s.step} className="flex items-center gap-3">
                      <div className={`w-6 h-6 flex items-center justify-center text-xs font-mono ${
                        s.status === 'complete' ? 'bg-[#10b981] text-white' :
                        s.status === 'running' ? 'bg-[#00d4ff] text-[#0a0a0c] animate-pulse' :
                        'bg-[#2a2a35] text-[#6b7280]'
                      }`}>
                        {s.status === 'complete' ? <CheckCircle className="w-4 h-4" /> : s.step}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-white">{s.title}</div>
                        <div className="text-xs text-[#6b7280]">{s.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Output */}
            <div className="lg:col-span-2">
              <div className="bg-[#141418] border border-[#2a2a35] h-full">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-[#2a2a35]">
                  <Cpu className="w-4 h-4 text-[#00d4ff]" />
                  <span className="text-xs font-mono text-[#00d4ff] uppercase">Live Output</span>
                  <span className="ml-auto flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                    <span className="text-xs text-[#6b7280]">Running</span>
                  </span>
                </div>
                <div className="p-6 font-mono text-sm h-96 overflow-y-auto">
                  <div className="text-[#6b7280]">$ ultradex run build-feature.dex</div>
                  <div className="mt-4 text-[#00d4ff]">▶ Parsing workflow...</div>
                  <div className="text-[#a0a0a8]">  ✓ Valid DAG structure</div>
                  <div className="text-[#a0a0a8]">  ✓ 3 steps identified</div>
                  <div className="mt-2 text-[#00d4ff]">▶ Scheduling tasks...</div>
                  <div className="text-[#a0a0a8]">  ✓ planner ready</div>
                  <div className="text-[#a0a0a8]">  ✓ architect ready</div>
                  <div className="text-[#a0a0a8]">  ✓ coder ready</div>
                  <div className="text-[#a0a0a8]">  ✓ tester ready</div>
                  <div className="mt-2 text-[#00d4ff]">▶ Executing...</div>
                  <div className="text-[#10b981]">  ✓ planner complete (0.8s)</div>
                  <div className="text-[#10b981]">  ✓ architect complete (1.2s)</div>
                  <div className="text-[#00d4ff] animate-pulse">  → coder running...</div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <Link
              href="/get-started"
              className="inline-flex items-center gap-2 px-8 py-4 text-sm font-medium border border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff]/10 transition-all"
            >
              <Play className="w-4 h-4" />
              <span>Try It Yourself</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
