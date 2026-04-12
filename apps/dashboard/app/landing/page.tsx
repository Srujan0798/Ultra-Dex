import React from 'react';
import { 
  Terminal, 
  Cpu, 
  Layers, 
  Users, 
  Shield, 
  ArrowRight,
  Github,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="space-y-32 -mt-8 -mx-8 pb-32">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-24 px-8 bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-1.5 rounded-full text-primary text-xs font-bold uppercase tracking-widest animate-fade-in">
            <Zap size={14} fill="currentColor" />
            V6.0 Ecosystem Phase Live
          </div>
          <h1 className="text-7xl font-bold tracking-tight leading-[1.1]">
            The AI Orchestration <br />
            <span className="text-primary">Platform for Teams</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Ultra-Dex connects your favorite AI models with persistent memory, real-time coordination, 
            and a community-driven plugin marketplace.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button size="lg" className="h-14 px-8 text-lg font-bold gap-2 group" asChild>
              <Link href="/">
                Get Started 
                <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-14 px-8 text-lg font-bold gap-2">
              <Github size={20} />
              Star on GitHub
            </Button>
          </div>

          {/* Terminal Animation Placeholder */}
          <div className="mt-20 max-w-4xl mx-auto bg-[#0d1117] rounded-2xl border border-border shadow-2xl overflow-hidden text-left font-mono text-sm">
            <div className="bg-[#161b22] px-4 py-3 border-b border-border flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/20" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
                <div className="w-3 h-3 rounded-full bg-green-500/20" />
              </div>
              <div className="text-muted-foreground text-xs ml-4">bash — ultra-dex</div>
            </div>
            <div className="p-6 space-y-2 opacity-80">
              <p><span className="text-green-500">$</span> npm install -g @ultra-dex/cli</p>
              <p className="text-blue-400"># Initializing Ultra-Dex Meta-Layer v6.0.0...</p>
              <p><span className="text-green-500">$</span> ultra-dex run <span className="text-yellow-400">"optimize database queries"</span> --optimize <span className="text-purple-400">cost</span></p>
              <p className="text-gray-500">▶ Routing to Provider: nvidia-nim-llama3 (Cheapest)</p>
              <p className="text-gray-500">▶ Using Agent: @backend</p>
              <p className="text-gray-500">▶ Loading Context: 12 relevant memories found</p>
              <p className="text-green-400">✔ Task complete. Saved $0.12 vs GPT-4.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-8">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-4xl font-bold">Everything you need to scale</h2>
          <p className="text-muted-foreground text-lg">Built for the next generation of AI-native applications.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { 
              title: 'Multi-Provider Routing', 
              desc: 'Automatically switch between OpenAI, Anthropic, Google, and NVIDIA based on cost, latency, or quality.',
              icon: Cpu
            },
            { 
              title: 'Persistent Memory', 
              desc: 'Infinite context with L1/L2/L3 memory tiers and semantic search that gets smarter with every task.',
              icon: Layers
            },
            { 
              title: 'Team Collaboration', 
              desc: 'Built-in RBAC, shared workspaces, and audit trails for production-grade governance.',
              icon: Users
            }
          ].map((feature) => (
            <div key={feature.title} className="space-y-4 text-center md:text-left">
              <div className="bg-primary/10 w-12 h-12 rounded-xl flex items-center justify-center mx-auto md:mx-0">
                <feature.icon className="text-primary" size={24} />
              </div>
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-card border-y border-border py-24 px-8">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-16 md:gap-32 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
          <span className="text-3xl font-black tracking-tighter">OPENAI</span>
          <span className="text-3xl font-black tracking-tighter">ANTHROPIC</span>
          <span className="text-3xl font-black tracking-tighter">GOOGLE</span>
          <span className="text-3xl font-black tracking-tighter">NVIDIA</span>
          <span className="text-3xl font-black tracking-tighter">MISTRAL</span>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto text-center px-8 space-y-8">
        <h2 className="text-5xl font-bold">Ready to automate the boring stuff?</h2>
        <p className="text-xl text-muted-foreground">Join 10,000+ developers building on the Ultra-Dex platform.</p>
        <Button size="lg" className="h-16 px-12 text-xl font-bold" asChild>
          <Link href="/">Launch Dashboard</Link>
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-border pt-16 px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 pb-16">
          <div className="col-span-2 space-y-4">
            <h3 className="text-xl font-bold">Ultra-Dex</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              The open-source AI orchestration layer for professional software teams.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold">Product</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="/marketplace">Marketplace</Link>
              <Link href="/pricing">Pricing</Link>
              <Link href="/certify">Certification</Link>
            </nav>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold">Community</h4>
            <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
              <Link href="#">GitHub</Link>
              <Link href="#">Discord</Link>
              <Link href="#">Documentation</Link>
            </nav>
          </div>
        </div>
        <div className="border-t border-border py-8 text-center text-xs text-muted-foreground">
          © 2026 Ultra-Dex Platform. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
