import Head from 'next/head';
import Link from 'next/link';

export default function Blog() {
  const posts = [
    {
      title: 'Why We Built Ultra-Dex: Solving the AI Memory Crisis',
      excerpt: 'The fundamental problem with current AI tools isn\'t their intelligence—it\'s their amnesia. Every session starts fresh, with no memory of previous interactions or context.',
      date: 'January 15, 2026',
      readTime: '8 min read',
      category: 'Product',
      slug: 'why-we-built-ultra-dex'
    },
    {
      title: 'Ultra-Dex vs LangChain: A Developer\'s Comparison',
      excerpt: 'A comprehensive comparison of Ultra-Dex and LangChain, covering architecture, performance, and use cases for each platform.',
      date: 'January 10, 2026',
      readTime: '12 min read',
      category: 'Comparison',
      slug: 'ultra-dex-vs-langchain'
    },
    {
      title: 'Building Production AI Agents: 5 Lessons Learned',
      excerpt: 'Our experience building production-ready AI agents and the lessons we learned along the way.',
      date: 'January 5, 2026',
      readTime: '10 min read',
      category: 'Engineering',
      slug: 'building-production-ai-agents'
    },
    {
      title: 'How We Cut AI Costs by 60% with Smart Routing',
      excerpt: 'Our approach to reducing AI costs through intelligent provider routing and optimization.',
      date: 'December 28, 2025',
      readTime: '7 min read',
      category: 'Optimization',
      slug: 'cutting-ai-costs'
    },
    {
      title: 'The Future of AI Orchestration: Our Vision',
      excerpt: 'Our thoughts on where AI orchestration is heading and how Ultra-Dex is preparing for the future.',
      date: 'December 20, 2025',
      readTime: '9 min read',
      category: 'Vision',
      slug: 'future-of-ai-orchestration'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <Head>
        <title>Ultra-Dex Blog | AI Orchestration Insights</title>
        <meta name="description" content="Insights, tutorials, and updates on AI orchestration and development" />
        <meta name="keywords" content="AI orchestration, multi-agent systems, persistent memory, AI development" />
        <link rel="canonical" href="https://ultra-dex.dev/blog" />
      </Head>

      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              The Ultra-Dex <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Blog</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Insights, tutorials, and updates on AI orchestration and development
            </p>
          </div>

          <div className="space-y-12">
            {posts.map((post, index) => (
              <article 
                key={index} 
                className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border p-8 hover:border-blue-500/50 transition-all ${
                  index === 0 ? 'border-blue-500' : 'border-gray-700'
                }`}
              >
                <div className="flex flex-wrap items-center text-sm text-gray-400 mb-4">
                  <span className="bg-blue-900/30 text-blue-400 px-3 py-1 rounded-full mr-4 mb-2">{post.category}</span>
                  <span>{post.date}</span>
                  <span className="mx-2">•</span>
                  <span>{post.readTime}</span>
                </div>
                <h2 className={`text-2xl md:text-3xl font-bold mb-4 ${
                  index === 0 ? 'text-blue-400' : 'text-white'
                }`}>{post.title}</h2>
                <p className="text-gray-300 text-lg mb-6">{post.excerpt}</p>
                <Link 
                  href={`/blog/${post.slug}`} 
                  className="inline-flex items-center text-blue-400 hover:text-blue-300 font-semibold group"
                >
                  Read Article
                  <svg 
                    className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </article>
            ))}
          </div>

          {/* Newsletter Signup */}
          <div className="mt-16 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-2xl border border-gray-700 p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Stay Updated</h2>
            <p className="text-gray-300 mb-6 max-w-md mx-auto">
              Get the latest news, tutorials, and product updates delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-grow px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              />
              <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold transition-all">
                Subscribe
              </button>
            </div>
            <p className="text-gray-500 text-sm mt-4">
              No spam ever. Unsubscribe at any time.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}