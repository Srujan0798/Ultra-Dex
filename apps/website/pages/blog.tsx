import Head from 'next/head';
import Link from 'next/link';
import { ArrowRight, Terminal, Calendar, Clock } from 'lucide-react';

const POSTS = [
  {
    title: 'Introducing DexGraph: Our DAG-Based Workflow Engine',
    excerpt: 'How we built a deterministic workflow engine that ensures reliable execution from goal to completion.',
    date: 'Apr 12, 2026',
    readTime: '8 min',
    category: 'Engineering',
    slug: 'introducing-dexgraph',
  },
  {
    title: 'Build the Brain, Delegate the Hands',
    excerpt: 'Why Ultra-Dex separates orchestration from execution and what that means for your AI workflows.',
    date: 'Apr 8, 2026',
    readTime: '6 min',
    category: 'Product',
    slug: 'brain-and-hands',
  },
  {
    title: 'Memory Architecture Deep Dive',
    excerpt: 'A technical exploration of our three-tier memory system: episodic, semantic, and state.',
    date: 'Apr 1, 2026',
    readTime: '12 min',
    category: 'Engineering',
    slug: 'memory-architecture',
  },
  {
    title: 'Intelligent Routing: Cost vs Quality',
    excerpt: 'How we automatically route tasks to the optimal provider based on your requirements.',
    date: 'Mar 25, 2026',
    readTime: '7 min',
    category: 'Optimization',
    slug: 'intelligent-routing',
  },
  {
    title: 'From v1.0 to v2.0: The Hard Reset',
    excerpt: 'Why we rebuilt Ultra-Dex from scratch and what we learned along the way.',
    date: 'Mar 15, 2026',
    readTime: '10 min',
    category: 'Company',
    slug: 'v2-hard-reset',
  },
];

export default function Blog() {
  const featured = POSTS[0];
  const others = POSTS.slice(1);

  return (
    <>
      <Head>
        <title>Blog — Ultra-Dex</title>
        <meta name="description" content="Engineering and product updates from Ultra-Dex" />
      </Head>

      {/* Hero */}
      <section className="py-24 border-b border-[#2a2a35]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="text-xs font-mono text-[#00d4ff] uppercase tracking-widest mb-4">
              Blog
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold text-white mb-6">
              Engineering & Product
            </h1>
            <p className="text-lg text-[#6b7280]">
              Deep dives into how we build Ultra-Dex.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href={`/blog/${featured.slug}`}
            className="block bg-[#141418] border border-[#00d4ff]/30 hover:border-[#00d4ff] transition-all group"
          >
            <div className="p-8 md:p-12">
              <div className="flex items-center gap-4 mb-6">
                <span className="px-3 py-1 text-xs font-mono text-[#00d4ff] bg-[#00d4ff]/10 border border-[#00d4ff]/30">
                  {featured.category}
                </span>
                <span className="flex items-center gap-1 text-xs text-[#6b7280]">
                  <Calendar className="w-3 h-3" />
                  {featured.date}
                </span>
                <span className="flex items-center gap-1 text-xs text-[#6b7280]">
                  <Clock className="w-3 h-3" />
                  {featured.readTime}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4 group-hover:text-[#00d4ff] transition-colors">
                {featured.title}
              </h2>
              <p className="text-lg text-[#6b7280] mb-6 max-w-2xl">
                {featured.excerpt}
              </p>
              <div className="flex items-center gap-2 text-[#00d4ff]">
                <span className="text-sm font-medium">Read article</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Post Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {others.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block bg-[#141418] border border-[#2a2a35] hover:border-[#00d4ff]/30 transition-all group"
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-2 py-1 text-xs font-mono text-[#6b7280] bg-[#2a2a35]">
                      {post.category}
                    </span>
                    <span className="text-xs text-[#6b7280]">{post.date}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-[#00d4ff] transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-[#6b7280] mb-4">{post.excerpt}</p>
                  <div className="flex items-center gap-1 text-[#00d4ff] text-sm">
                    <span>Read</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Newsletter */}
          <div className="mt-16 bg-[#141418] border border-[#2a2a35] p-8 text-center">
            <div className="inline-flex items-center gap-2 mb-4">
              <Terminal className="w-4 h-4 text-[#00d4ff]" />
              <span className="text-xs font-mono text-[#00d4ff] uppercase">Subscribe</span>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Stay updated</h3>
            <p className="text-[#6b7280] mb-6">Get the latest posts delivered to your inbox.</p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="you@example.com"
                className="flex-1 px-4 py-3 bg-[#0a0a0c] border border-[#2a2a35] text-white placeholder:text-[#6b7280] focus:border-[#00d4ff] outline-none transition-colors"
              />
              <button className="px-6 py-3 border border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff]/10 transition-all">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
