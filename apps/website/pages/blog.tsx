import Head from 'next/head';
import Link from 'next/link';
import { FiCalendar, FiUser, FiClock, FiTag, FiArrowRight, FiTrendingUp, FiZap, FiShield, FiGlobe, FiGitBranch } from 'react-icons/fi';

export default function BlogPage() {
  const blogPosts = [
    {
      id: '1',
      title: 'Why We Built Ultra-Dex: The Need for AI Orchestration Meta-Layers',
      excerpt: 'Understanding the challenges of modern AI development and why traditional frameworks fall short for enterprise applications.',
      date: '2026-02-10',
      author: 'Srujan Sai Karna',
      readTime: '8 min',
      tags: ['AI', 'Orchestration', 'Enterprise'],
      category: 'Announcements'
    },
    {
      id: '2',
      title: 'Ultra-Dex vs LangChain: A Comprehensive Comparison',
      excerpt: 'Comparing Ultra-Dex with LangChain across performance, security, and enterprise features.',
      date: '2026-02-08',
      author: 'Srujan Sai Karna',
      readTime: '12 min',
      tags: ['Comparison', 'Frameworks', 'Performance'],
      category: 'Technical'
    },
    {
      id: '3',
      title: 'Building Secure AI Workflows with Ultra-Dex',
      excerpt: 'How Ultra-Dex implements enterprise-grade security controls for AI orchestration.',
      date: '2026-02-05',
      author: 'Srujan Sai Karna',
      readTime: '10 min',
      tags: ['Security', 'Compliance', 'Enterprise'],
      category: 'Security'
    },
    {
      id: '4',
      title: 'Getting Started with Multi-Agent Orchestration',
      excerpt: 'A practical guide to coordinating multiple AI agents for complex tasks.',
      date: '2026-02-01',
      author: 'Srujan Sai Karna',
      readTime: '15 min',
      tags: ['Agents', 'Orchestration', 'Tutorial'],
      category: 'Tutorials'
    },
    {
      id: '5',
      title: 'Memory Management in AI Systems: Hot, Warm, Cold Tiers',
      excerpt: 'Understanding Ultra-Dex\'s tiered memory architecture for persistent AI context.',
      date: '2026-01-28',
      author: 'Srujan Sai Karna',
      readTime: '7 min',
      tags: ['Memory', 'Architecture', 'Performance'],
      category: 'Technical'
    }
  ];

  const categories = [
    { name: 'All', count: 24, active: true },
    { name: 'Technical', count: 12, active: false },
    { name: 'Announcements', count: 5, active: false },
    { name: 'Security', count: 4, active: false },
    { name: 'Tutorials', count: 8, active: false }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Blog - Ultra-Dex AI Orchestration</title>
        <meta name="description" content="Insights, tutorials, and announcements from the Ultra-Dex team" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Ultra-Dex Blog</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Insights, tutorials, and announcements from the Ultra-Dex team. 
            Learn about AI orchestration, enterprise security, and best practices.
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map((category, index) => (
            <button
              key={index}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                category.active
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>

        {/* Featured Post */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-16">
          <div className="md:flex">
            <div className="md:flex-shrink-0 md:w-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
              <div className="text-center text-white p-8">
                <FiZap className="h-16 w-16 mx-auto mb-4" />
                <h2 className="text-2xl font-bold">Featured: Why We Built Ultra-Dex</h2>
                <p className="mt-2 opacity-90">The need for enterprise-grade AI orchestration</p>
              </div>
            </div>
            <div className="p-8 md:w-1/2">
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <FiCalendar className="mr-1" />
                <span>February 10, 2026</span>
                <span className="mx-2">•</span>
                <FiUser className="mr-1" />
                <span>Srujan Sai Karna</span>
                <span className="mx-2">•</span>
                <FiClock className="mr-1" />
                <span>8 min read</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Why We Built Ultra-Dex: The Need for AI Orchestration Meta-Layers
              </h2>
              <p className="text-gray-600 mb-6">
                Understanding the challenges of modern AI development and why traditional frameworks fall short for enterprise applications.
              </p>
              <div className="flex flex-wrap gap-2 mb-6">
                {['AI', 'Orchestration', 'Enterprise'].map((tag, idx) => (
                  <span key={idx} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                    <FiTag className="mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
              <Link href="/blog/why-we-built-ultra-dex" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium">
                Read Article
                <FiArrowRight className="ml-2" />
              </Link>
            </div>
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.slice(1).map((post) => (
            <article key={post.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <FiCalendar className="mr-1" />
                  <span>{new Date(post.date).toLocaleDateString()}</span>
                  <span className="mx-2">•</span>
                  <FiUser className="mr-1" />
                  <span>{post.author}</span>
                  <span className="mx-2">•</span>
                  <FiClock className="mr-1" />
                  <span>{post.readTime}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{post.title}</h3>
                <p className="text-gray-600 mb-4">{post.excerpt}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {tag}
                    </span>
                  ))}
                </div>
                <Link href={`/blog/${post.id}`} className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium">
                  Read More
                  <FiArrowRight className="ml-2" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="mt-16 bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Stay Updated</h2>
          <p className="mb-6 max-w-2xl mx-auto">
            Get the latest insights on AI orchestration, enterprise security, and Ultra-Dex updates delivered to your inbox.
          </p>
          <div className="max-w-md mx-auto flex">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-l-lg text-gray-900 focus:outline-none"
            />
            <button className="bg-indigo-800 px-6 py-3 rounded-r-lg font-medium hover:bg-indigo-900">
              Subscribe
            </button>
          </div>
        </div>

        {/* Popular Topics */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Topics</h2>
          <div className="flex flex-wrap gap-4">
            {[
              { name: 'AI Orchestration', icon: <FiZap className="mr-2" />, count: 12 },
              { name: 'Enterprise Security', icon: <FiShield className="mr-2" />, count: 8 },
              { name: 'Multi-Agent Systems', icon: <FiUsers className="mr-2" />, count: 10 },
              { name: 'Memory Management', icon: <FiDatabase className="mr-2" />, count: 7 },
              { name: 'MCP Integration', icon: <FiGlobe className="mr-2" />, count: 5 },
              { name: 'Performance', icon: <FiTrendingUp className="mr-2" />, count: 6 }
            ].map((topic, idx) => (
              <Link key={idx} href={`/blog/tag/${topic.name.toLowerCase().replace(' ', '-')}`} className="flex items-center px-4 py-2 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:shadow-sm">
                {topic.icon}
                <span className="font-medium text-gray-900">{topic.name}</span>
                <span className="ml-2 text-sm text-gray-500">({topic.count})</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}