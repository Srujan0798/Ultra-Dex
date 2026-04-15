import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Shield, Activity, Server, Lock, ArrowRight, Terminal } from 'lucide-react';

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
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    teamSize: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus('success');
        setForm({ name: '', email: '', company: '', teamSize: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

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
                href="#contact"
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

      {/* Contact Form */}
      <section id="contact" className="py-24 border-t border-[#2a2a35]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <div className="inline-flex items-center gap-2 mb-4">
                <Terminal className="w-4 h-4 text-[#00d4ff]" />
                <span className="text-xs font-mono text-[#00d4ff] uppercase">Contact Sales</span>
              </div>
              <h2 className="text-3xl font-semibold text-white mb-4">
                Let's talk about Enterprise
              </h2>
              <p className="text-[#6b7280] mb-8 max-w-md">
                Tell us what you're building and we'll get back to you within 24 hours to schedule a personalized demo.
              </p>
              <ul className="space-y-4 text-sm text-[#a0a0a8]">
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]" />
                  Governance policies & audit trails
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]" />
                  SSO/SAML & RBAC
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]" />
                  Multi-tenant deployments
                </li>
                <li className="flex items-center gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]" />
                  SLA-backed support
                </li>
              </ul>
            </div>

            <div className="bg-[#141418] border border-[#2a2a35] p-8">
              {status === 'success' ? (
                <div className="text-center py-12">
                  <div className="text-2xl mb-4">🚀</div>
                  <h3 className="text-xl font-semibold text-white mb-2">Message sent</h3>
                  <p className="text-[#6b7280]">We'll be in touch within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-mono text-[#a0a0a8] uppercase mb-2">Name</label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        required
                        className="w-full bg-[#0a0a0c] border border-[#2a2a35] px-4 py-3 text-sm text-white placeholder-[#6b7280] focus:border-[#00d4ff] focus:outline-none"
                        placeholder="Jane Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-[#a0a0a8] uppercase mb-2">Email</label>
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        className="w-full bg-[#0a0a0c] border border-[#2a2a35] px-4 py-3 text-sm text-white placeholder-[#6b7280] focus:border-[#00d4ff] focus:outline-none"
                        placeholder="jane@company.com"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-mono text-[#a0a0a8] uppercase mb-2">Company</label>
                      <input
                        name="company"
                        value={form.company}
                        onChange={handleChange}
                        required
                        className="w-full bg-[#0a0a0c] border border-[#2a2a35] px-4 py-3 text-sm text-white placeholder-[#6b7280] focus:border-[#00d4ff] focus:outline-none"
                        placeholder="Acme Inc"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono text-[#a0a0a8] uppercase mb-2">Team Size</label>
                      <select
                        name="teamSize"
                        value={form.teamSize}
                        onChange={handleChange}
                        className="w-full bg-[#0a0a0c] border border-[#2a2a35] px-4 py-3 text-sm text-white focus:border-[#00d4ff] focus:outline-none"
                      >
                        <option value="">Select...</option>
                        <option value="10-50">10–50</option>
                        <option value="50-200">50–200</option>
                        <option value="200+">200+</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-[#a0a0a8] uppercase mb-2">Message</label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      required
                      rows={4}
                      className="w-full bg-[#0a0a0c] border border-[#2a2a35] px-4 py-3 text-sm text-white placeholder-[#6b7280] focus:border-[#00d4ff] focus:outline-none resize-none"
                      placeholder="Tell us about your use case..."
                    />
                  </div>
                  {status === 'error' && (
                    <p className="text-sm text-red-400">Something went wrong. Please try again.</p>
                  )}
                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-medium border border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff]/10 transition-all disabled:opacity-50"
                  >
                    {status === 'submitting' ? 'Sending...' : 'Send Message'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
