import Head from 'next/head';
import Link from 'next/link';

export default function Contact() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <Head>
        <title>Contact Ultra-Dex | Get in Touch</title>
        <meta name="description" content="Get in touch with the Ultra-Dex team for support, sales, or partnership inquiries" />
        <meta name="keywords" content="contact Ultra-Dex, Ultra-Dex support, sales inquiry, partnership" />
        <link rel="canonical" href="https://ultra-dex.dev/contact" />
      </Head>

      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Get in <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Touch</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Have questions about Ultra-Dex? We'd love to hear from you.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold mb-6">Send us a message</h2>
              <form className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                    placeholder="Your name"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                    placeholder="your.email@example.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
                    Subject
                  </label>
                  <select
                    id="subject"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  >
                    <option value="">Select a subject</option>
                    <option value="support">Technical Support</option>
                    <option value="sales">Sales Inquiry</option>
                    <option value="partnership">Partnership</option>
                    <option value="general">General Question</option>
                    <option value="feedback">Feedback</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={5}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                    placeholder="Tell us more about your project..."
                  ></textarea>
                </div>
                
                <button
                  type="submit"
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg font-semibold transition-all"
                >
                  Send Message
                </button>
              </form>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
              
              <div className="space-y-6 mb-12">
                <div className="flex items-start">
                  <div className="text-blue-400 text-2xl mr-4">📧</div>
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <p className="text-gray-400">hello@ultra-dex.dev</p>
                    <p className="text-gray-500 text-sm">For general inquiries</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="text-blue-400 text-2xl mr-4">💼</div>
                  <div>
                    <h3 className="font-semibold">Sales</h3>
                    <p className="text-gray-400">sales@ultra-dex.dev</p>
                    <p className="text-gray-500 text-sm">For enterprise and pricing questions</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="text-blue-400 text-2xl mr-4">🛡️</div>
                  <div>
                    <h3 className="font-semibold">Security</h3>
                    <p className="text-gray-400">security@ultra-dex.dev</p>
                    <p className="text-gray-500 text-sm">For security-related issues</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="text-blue-400 text-2xl mr-4">🏢</div>
                  <div>
                    <h3 className="font-semibold">Office</h3>
                    <p className="text-gray-400">
                      San Francisco, CA<br />
                      United States
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="text-blue-400 text-2xl mr-4">💬</div>
                  <div>
                    <h3 className="font-semibold">Community</h3>
                    <p className="text-gray-400">
                      Join our Discord community for real-time support and discussions
                    </p>
                    <a href="https://discord.gg/ultra-dex" className="text-blue-400 hover:underline mt-2 inline-block">
                      Join Discord
                    </a>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 border border-gray-700">
                <h3 className="text-xl font-bold mb-4">Support Hours</h3>
                <p className="text-gray-300 mb-2">Monday - Friday: 9am - 6pm PST</p>
                <p className="text-gray-300">Weekends: Limited support</p>
                
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <h4 className="font-semibold mb-2">For urgent issues:</h4>
                  <p className="text-gray-400 text-sm">
                    Enterprise customers have 24/7 support access. 
                    Contact your account manager for emergency support.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}