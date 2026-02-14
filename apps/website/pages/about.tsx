import Head from 'next/head';
import Link from 'next/link';
import { FiUsers, FiCode, FiZap, FiShield, FiGlobe, FiHeart, FiAward, FiStar, FiGitBranch, FiDatabase, FiBarChart3, FiClock, FiCpu, FiLayers, FiTerminal, FiCheck, FiArrowRight } from 'react-icons/fi';

export default function AboutPage() {
  const teamMembers = [
    {
      name: 'Srujan Sai Karna',
      role: 'Founder & CEO',
      bio: 'Former AI researcher at OpenAI, architect of large-scale ML systems',
      avatar: '/avatars/srujan.jpg',
      linkedin: 'https://linkedin.com/in/srujan-karna',
      twitter: 'https://twitter.com/srujan_karna'
    },
    {
      name: 'Roshwin Ram',
      role: 'CTO & Lead Engineer',
      bio: 'Ex-Netflix engineer, specializes in distributed systems and AI infrastructure',
      avatar: '/avatars/roshwin.jpg',
      linkedin: 'https://linkedin.com/in/roshwin-ram',
      twitter: 'https://twitter.com/roshwin_ram'
    },
    {
      name: 'Sai Karthik',
      role: 'Head of AI Research',
      bio: 'PhD in Machine Learning, former researcher at Anthropic',
      avatar: '/avatars/sai.jpg',
      linkedin: 'https://linkedin.com/in/sai-karthik',
      twitter: 'https://twitter.com/sai_karthik'
    },
    {
      name: 'Srujan Reddy',
      role: 'VP of Engineering',
      bio: 'Ex-Google engineer, built infrastructure for millions of users',
      avatar: '/avatars/srujan-reddy.jpg',
      linkedin: 'https://linkedin.com/in/srujan-reddy',
      twitter: 'https://twitter.com/srujan_reddy'
    }
  ];

  const milestones = [
    { year: '2024', event: 'Initial concept and architecture design' },
    { year: '2025', event: 'Alpha release to select enterprise partners' },
    { year: '2026', event: 'Beta release with full feature set' },
    { year: '2026', event: 'Public launch and Series A funding' },
    { year: '2027', event: 'Fortune 500 customer acquisition' },
    { year: '2028', event: 'Global expansion and localization' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>About Us - Ultra-Dex AI Orchestration</title>
        <meta name="description" content="Learn about the Ultra-Dex team and mission" />
      </Head>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-gray-900 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Building the Future of <span className="text-indigo-300">AI Orchestration</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Ultra-Dex is the AI orchestration meta-layer that enables enterprises to build, deploy, and scale 
              AI-powered applications with confidence.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              We believe that AI orchestration should be as simple as calling an API, as secure as enterprise software, 
              and as powerful as the best human teams. Ultra-Dex eliminates the complexity of multi-agent coordination, 
              memory management, and tool integration, letting you focus on what matters: building amazing AI applications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="text-indigo-600 mb-4 flex justify-center">
                <FiZap className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Simplicity</h3>
              <p className="text-gray-600">
                Abstract away the complexity of AI orchestration with intuitive APIs and visual tools
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="text-indigo-600 mb-4 flex justify-center">
                <FiShield className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Security</h3>
              <p className="text-gray-600">
                Enterprise-grade security with SSO, RBAC, audit logging, and data encryption
              </p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="text-indigo-600 mb-4 flex justify-center">
                <FiGlobe className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Power</h3>
              <p className="text-gray-600">
                Leverage the collective intelligence of specialized AI agents working in harmony
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Meet the Team</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Passionate engineers and researchers building the future of AI orchestration
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="text-center">
                <div className="mx-auto mb-4">
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-32 h-32 mx-auto" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                <p className="text-indigo-600 font-medium">{member.role}</p>
                <p className="text-gray-600 mt-2 text-sm">{member.bio}</p>
                <div className="flex justify-center space-x-4 mt-4">
                  <Link href={member.linkedin} className="text-gray-400 hover:text-indigo-600">
                    <FiLinkedin className="h-5 w-5" />
                  </Link>
                  <Link href={member.twitter} className="text-gray-400 hover:text-indigo-600">
                    <FiTwitter className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Milestones */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Journey</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Key milestones in building the world's most advanced AI orchestration platform
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-0.5 bg-indigo-200"></div>
            
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div key={index} className={`relative flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <div className={`w-5/12 ${index % 2 === 0 ? 'mr-auto' : 'ml-auto'}`}>
                    <div className="bg-white rounded-lg shadow-md p-6">
                      <div className="flex items-start">
                        <div className="bg-indigo-100 text-indigo-800 text-sm font-bold px-3 py-1 rounded-full">
                          {milestone.year}
                        </div>
                        <div className="ml-4">
                          <h3 className="text-lg font-semibold text-gray-900">{milestone.event}</h3>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-indigo-600 border-4 border-white z-10"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Values Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Principles that guide everything we build and do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="border border-gray-200 rounded-lg p-8">
              <div className="flex items-start">
                <div className="bg-indigo-100 p-3 rounded-lg mr-4">
                  <FiHeart className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Customer Obsessed</h3>
                  <p className="text-gray-600">
                    We build what our customers need, not what we think they need. Every feature solves real problems 
                    for real developers and enterprises.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-8">
              <div className="flex items-start">
                <div className="bg-indigo-100 p-3 rounded-lg mr-4">
                  <FiShield className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Security First</h3>
                  <p className="text-gray-600">
                    Security isn't an afterthought—it's foundational. We build with enterprise security requirements 
                    from day one.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-8">
              <div className="flex items-start">
                <div className="bg-indigo-100 p-3 rounded-lg mr-4">
                  <FiZap className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Simplicity Over Complexity</h3>
                  <p className="text-gray-600">
                    We believe powerful tools should be simple to use. We abstract complexity so you can focus on 
                    building amazing things.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-8">
              <div className="flex items-start">
                <div className="bg-indigo-100 p-3 rounded-lg mr-4">
                  <FiGlobe className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Open & Transparent</h3>
                  <p className="text-gray-600">
                    We're committed to open standards, transparent pricing, and clear communication about what 
                    we're building and why.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Technology Stack */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Technology Stack</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Built with the best tools for performance, security, and scalability
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { name: 'Node.js', description: 'Runtime environment' },
              { name: 'Next.js', description: 'Frontend framework' },
              { name: 'PostgreSQL', description: 'Primary database' },
              { name: 'Redis', description: 'Caching layer' },
              { name: 'Docker', description: 'Containerization' },
              { name: 'Kubernetes', description: 'Orchestration' },
              { name: 'TypeScript', description: 'Type safety' },
              { name: 'Tailwind CSS', description: 'Styling' }
            ].map((tech, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6 text-center">
                <h3 className="font-bold text-gray-900">{tech.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{tech.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-indigo-600 to-purple-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Join Our Mission</h2>
          <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-8">
            Be part of building the future of AI orchestration. Start building with Ultra-Dex today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/signup" className="bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-100 flex items-center justify-center">
              Get Started Free
              <FiArrowRight className="ml-2" />
            </Link>
            <Link href="/docs" className="bg-indigo-800 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-indigo-900 flex items-center justify-center">
              Read Documentation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}