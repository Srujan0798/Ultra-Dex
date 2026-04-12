import Head from 'next/head';
import Link from 'next/link';
import { Shield, Activity, Globe, Users, Server, Lock, ArrowRight, Terminal } from 'lucide-react';

const FEATURES = [
  {
    icon: <Shield className="w-5 h-5" />,
    title: 'Security',
    items: ['SOC 2 Type II', 'SSO/SAML', 'RBAC', 'End-to-end encryption'],
  },
  {
    icon: <Activity className="w-5 h-5" />,
    title: 'Scale',
    items: ['Horizontal scaling', '99.99% SLA', 'Sub-200ms latency', 'Multi-region'],
  },
  {
    icon: <Lock className="w-5 h-5" />,
    title: 'Compliance',
    items: ['GDPR ready', 'HIPAA eligible', 'ISO 27001', 'Audit logs'],
  },
  {
    icon: <Server className="w-5 h-5" />,
    title: 'Deployment',
    items: ['Private cloud', 'On-premise', 'VPC isolation', 'Custom domains'],
  },
];

export default function Enterprise() {
  return (
    <>
      <Head>
        <title>Enterprise — Ultra-Dex</title>
        <meta name="description" content="Enterprise-grade workflow orchestration" />
      </Head>

      {/* Hero */}
      <section className="py-24 border-b border-[#2a2a35]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="text-xs font-mono text-[#00d4ff] uppercase tracking-widest mb-4">
              Enterprise
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold text-white mb-6">
              For organizations that need control
            </h1>
            <p className="text-lg text-[#6b7280] mb-8 leading-relaxed">
              Production-ready AI orchestration with enterprise-grade security, compliance, and scalability.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 text-sm font-medium border border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff]/10 transition-all"
              >
                Contact Sales
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-8 py-4 text-sm font-medium border border-[#2a2a35] text-[#a0a0a8] hover:border-[#00d4ff]/50 hover:text-white transition-all"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-[#141418] border border-[#2a2a35] p-8"
              >
                <div className="w-10 h-10 flex items-center justify-center border border-[#2a2a35] text-[#00d4ff] mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-4">{feature.title}</h3>
                <ul className="space-y-2">
                  {feature.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-[#6b7280]">
                      <span className="w-1 h-1 rounded-full bg-[#00d4ff]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-[#2a2a35]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#141418] border border-[#2a2a35] p-12 text-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <Terminal className="w-4 h-4 text-[#00d4ff]" />
              <span className="text-xs font-mono text-[#00d4ff] uppercase">Ready to deploy?</span>
            </div>
            <h2 className="text-3xl font-semibold text-white mb-4">
              Schedule a demo
            </h2>
            <p className="text-[#6b7280] mb-8 max-w-xl mx-auto">
              See how Ultra-Dex can transform your AI workflows. Personalized demo with our enterprise team.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 text-sm font-medium border border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff]/10 transition-all"
            >
              Contact Sales
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
