import Head from 'next/head';
import { Mail, MessageSquare, GitBranch, Terminal, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const CHANNELS = [
  {
    icon: <Mail className="w-5 h-5" />,
    title: 'Email',
    value: 'hello@ultra-dex.dev',
    description: 'General inquiries',
  },
  {
    icon: <MessageSquare className="w-5 h-5" />,
    title: 'Discord',
    value: 'Join Community',
    description: 'Real-time support',
  },
  {
    icon: <GitBranch className="w-5 h-5" />,
    title: 'GitHub',
    value: 'github.com/Srujan0798',
    description: 'Issues & PRs',
  },
];

export default function Contact() {
  return (
    <>
      <Head>
        <title>Contact — Ultra-Dex</title>
        <meta name="description" content="Get in touch with the Ultra-Dex team" />
      </Head>

      {/* Hero */}
      <section className="py-24 border-b border-[#2a2a35]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="text-xs font-mono text-[#00d4ff] uppercase tracking-widest mb-4">
              Contact
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold text-white mb-6">
              Get in touch
            </h1>
            <p className="text-lg text-[#6b7280]">
              Questions, feedback, or enterprise inquiries? We're here to help.
            </p>
          </div>
        </div>
      </section>

      {/* Channels */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CHANNELS.map((channel) => (
              <div
                key={channel.title}
                className="group bg-[#141418] border border-[#2a2a35] hover:border-[#00d4ff]/30 transition-all p-8"
              >
                <div className="w-10 h-10 flex items-center justify-center border border-[#2a2a35] text-[#00d4ff] mb-6 group-hover:border-[#00d4ff]/50 transition-all">
                  {channel.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-1">{channel.title}</h3>
                <p className="text-[#00d4ff] font-mono text-sm mb-2">{channel.value}</p>
                <p className="text-sm text-[#6b7280]">{channel.description}</p>
              </div>
            ))}
          </div>

          {/* Enterprise CTA */}
          <div className="mt-16 bg-[#141418] border border-[#2a2a35] p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Terminal className="w-4 h-4 text-[#00d4ff]" />
                  <span className="text-xs font-mono text-[#00d4ff] uppercase">Enterprise</span>
                </div>
                <h2 className="text-2xl font-semibold text-white mb-2">Need dedicated support?</h2>
                <p className="text-[#6b7280]">Get priority support, custom integrations, and SLA guarantees.</p>
              </div>
              <Link
                href="/enterprise"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium border border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff]/10 transition-all shrink-0"
              >
                Contact Sales
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
