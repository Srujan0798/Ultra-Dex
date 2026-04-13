"use client";

import { motion } from "framer-motion";
import { 
  ArrowRight, 
  CheckCircle,
  Cpu, 
  Database, 
  GitBranch, 
  Layers, 
  Shield, 
  Workflow,
  Zap
} from "lucide-react";
import Link from "next/link";

const features = [
  {
    icon: Workflow,
    title: "Workflow Orchestration",
    description: "Define complex AI workflows as DAGs with dependencies, retries, and rollbacks built-in."
  },
  {
    icon: Cpu,
    title: "Multi-Agent Coordination",
    description: "Deploy specialized agents (Planner, Coder, Tester, Reviewer) that collaborate on tasks."
  },
  {
    icon: Database,
    title: "Persistent Memory",
    description: "Three-tier memory system: Episodic, Semantic, and State for context-aware execution."
  },
  {
    icon: GitBranch,
    title: "Provider Routing",
    description: "Route tasks to optimal AI providers (OpenAI, Claude, Gemini, Groq) based on cost/quality."
  },
  {
    icon: Shield,
    title: "Governance & Safety",
    description: "Built-in policy engine with budget controls, rate limits, and approval gates."
  },
  {
    icon: Zap,
    title: "Deterministic Execution",
    description: "State machine-driven execution with full observability and crash recovery."
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-void overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-void/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-cyan/10 border border-cyan rounded flex items-center justify-center">
              <Layers className="w-5 h-5 text-cyan" />
            </div>
            <span className="font-display font-bold text-lg text-text-primary tracking-tight">
              ULTRA-DEX
            </span>
          </Link>
          <div className="flex items-center gap-8">
            <Link href="#features" className="text-sm text-text-secondary hover:text-cyan transition-colors font-display uppercase tracking-wider">
              Features
            </Link>
            <Link href="#architecture" className="text-sm text-text-secondary hover:text-cyan transition-colors font-display uppercase tracking-wider">
              Architecture
            </Link>
            <Link href="/" className="btn-industrial">
              Launch Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan/10 border border-cyan/30 rounded mb-8">
              <span className="w-2 h-2 bg-cyan rounded-full animate-pulse" />
              <span className="text-sm text-cyan font-display uppercase tracking-wider">
                v6.0.0 Now Available
              </span>
            </div>
            
            <h1 className="font-display text-5xl md:text-7xl font-bold text-text-primary mb-6 leading-tight">
              AI Orchestration
              <br />
              <span className="text-cyan text-glow-cyan">Control Plane</span>
            </h1>
            
            <p className="text-xl text-text-secondary max-w-2xl mx-auto mb-10">
              Route any AI task to any provider with persistent memory. 
              Build deterministic, observable, and governable AI workflows.
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <Link href="/" className="btn-industrial flex items-center gap-2 text-lg px-6 py-3">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="https://github.com/Srujan0798/Ultra-Dex" className="px-6 py-3 border border-border text-text-secondary hover:text-text-primary hover:border-cyan/30 rounded transition-all font-display uppercase tracking-wider">
                View on GitHub
              </a>
            </div>
          </motion.div>

          {/* Code Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-16 max-w-3xl mx-auto"
          >
            <div className="terminal">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
                <div className="w-3 h-3 rounded-full bg-failed" />
                <div className="w-3 h-3 rounded-full bg-pending" />
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="ml-4 text-xs text-text-tertiary font-display">workflow.dex</span>
              </div>
              <pre className="text-sm font-code">
                <code>
                  <span className="text-cyan">name</span>: <span className="text-amber">"Deploy Production"</span>
                  <br />
                  <span className="text-cyan">tasks</span>:
                  <br />
                  {"  "}- <span className="text-cyan">id</span>: <span className="text-amber">"test"</span>
                  <br />
                  {"    "}<span className="text-cyan">agent</span>: <span className="text-amber">"tester"</span>
                  <br />
                  {"    "}<span className="text-cyan">command</span>: <span className="text-amber">"npm test"</span>
                  <br />
                  {"  "}- <span className="text-cyan">id</span>: <span className="text-amber">"build"</span>
                  <br />
                  {"    "}<span className="text-cyan">depends_on</span>: [<span className="text-amber">"test"</span>]
                  <br />
                  {"    "}<span className="text-cyan">agent</span>: <span className="text-amber">"coder"</span>
                  <br />
                  {"    "}<span className="text-cyan">command</span>: <span className="text-amber">"npm run build"</span>
                  <br />
                  {"  "}- <span className="text-cyan">id</span>: <span className="text-amber">"deploy"</span>
                  <br />
                  {"    "}<span className="text-cyan">depends_on</span>: [<span className="text-amber">"build"</span>]
                  <br />
                  {"    "}<span className="text-cyan">agent</span>: <span className="text-amber">"devops"</span>
                  <br />
                  {"    "}<span className="text-cyan">command</span>: <span className="text-amber">"deploy --prod"</span>
                </code>
              </pre>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-text-primary mb-4">
              Built for Production
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Everything you need to orchestrate AI workflows at scale
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-in">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="glass-card p-6 group hover:border-cyan/30 transition-all">
                  <div className="w-12 h-12 bg-cyan/10 border border-cyan/30 rounded flex items-center justify-center mb-4 group-hover:glow-cyan transition-all">
                    <Icon className="w-6 h-6 text-cyan" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-text-primary mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-text-secondary text-sm">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section id="architecture" className="py-20 px-6 border-t border-border bg-panel/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-4xl font-bold text-text-primary mb-6">
                DexGraph Architecture
              </h2>
              <p className="text-text-secondary mb-6">
                Ultra-Dex is built on a deterministic DAG execution engine called DexGraph. 
                It treats AI workflows as graphs with states, dependencies, and transitions.
              </p>
              <ul className="space-y-4">
                {[
                  "Workflow DSL for declarative task definitions",
                  "State machine-driven execution (CREATED → READY → RUNNING → SUCCESS)",
                  "Automatic dependency resolution and parallel execution",
                  "Built-in retry, rollback, and failure recovery",
                  "Real-time event streaming and observability"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-cyan flex-shrink-0 mt-0.5" />
                    <span className="text-text-secondary">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-card p-8">
              <pre className="text-sm font-code overflow-x-auto">
                <code className="text-text-secondary">
                  <span className="text-cyan">┌─────────────────┐</span>
                  <br />
                  <span className="text-cyan">│  Workflow DSL   │</span>
                  <br />
                  <span className="text-cyan">└────────┬────────┘</span>
                  <br />
                  {"         │"}
                  <br />
                  <span className="text-cyan">┌────────▼────────┐</span>
                  <br />
                  <span className="text-cyan">│     Parser      │</span>
                  <br />
                  <span className="text-cyan">└────────┬────────┘</span>
                  <br />
                  {"         │"}
                  <br />
                  <span className="text-cyan">┌────────▼────────┐</span>
                  <br />
                  <span className="text-cyan">│   DexGraph      │</span>
                  <br />
                  <span className="text-cyan">│   (DAG Engine)  │</span>
                  <br />
                  <span className="text-cyan">└────────┬────────┘</span>
                  <br />
                  {"         │"}
                  <br />
                  <span className="text-cyan">┌────────▼────────┐</span>
                  <br />
                  <span className="text-cyan">│    Scheduler    │</span>
                  <br />
                  <span className="text-cyan">└────────┬────────┘</span>
                  <br />
                  {"         │"}
                  <br />
                  <span className="text-cyan">┌────────▼────────┐</span>
                  <br />
                  <span className="text-cyan">│  Agent Workers  │</span>
                  <br />
                  <span className="text-cyan">└─────────────────┘</span>
                </code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-display text-4xl font-bold text-text-primary mb-6">
            Ready to Orchestrate?
          </h2>
          <p className="text-text-secondary mb-8 max-w-xl mx-auto">
            Start building deterministic AI workflows with Ultra-Dex today.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/" className="btn-industrial flex items-center gap-2 text-lg px-8 py-4">
              Launch Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-cyan/10 border border-cyan rounded flex items-center justify-center">
              <Layers className="w-4 h-4 text-cyan" />
            </div>
            <span className="font-display text-sm text-text-tertiary">
              Ultra-Dex v6.0.0
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-text-tertiary hover:text-cyan transition-colors font-display">
              Documentation
            </a>
            <a href="#" className="text-sm text-text-tertiary hover:text-cyan transition-colors font-display">
              GitHub
            </a>
            <a href="#" className="text-sm text-text-tertiary hover:text-cyan transition-colors font-display">
              Twitter
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
