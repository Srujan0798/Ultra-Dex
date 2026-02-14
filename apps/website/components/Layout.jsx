import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { FiMenu, FiX, FiGithub, FiTwitter, FiBook, FiZap, FiShield, FiGlobe, FiCpu, FiDatabase, FiLayers, FiCode, FiTerminal, FiUser, FiMail, FiLock, FiServer, FiBarChart3 } from 'react-icons/fi';

const Layout = ({ children, title = 'Ultra-Dex - AI Orchestration Meta-Layer' }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '/features' },
    { name: 'Pricing', href: '/pricing' },
    { name: 'Documentation', href: '/docs' },
    { name: 'Blog', href: '/blog' },
    { name: 'Enterprise', href: '/enterprise' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{title}</title>
        <meta name="description" content="Enterprise-grade AI orchestration platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <div className="bg-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">UD</span>
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">Ultra-Dex</span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-indigo-600 font-medium"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              <Link href="/login" className="text-gray-600 hover:text-indigo-600 hidden md:block">
                Sign In
              </Link>
              <Link 
                href="/signup" 
                className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700"
              >
                Get Started
              </Link>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-700 hover:text-gray-900"
              >
                {mobileMenuOpen ? <FiX /> : <FiMenu />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <Link
                href="/login"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            </div>
          </div>
        )}
      </header>

      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="bg-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">UD</span>
                </div>
                <span className="ml-2 text-xl font-bold">Ultra-Dex</span>
              </div>
              <p className="text-gray-400 text-sm">
                AI orchestration infrastructure for the enterprise era.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/docs" className="hover:text-white">Documentation</Link></li>
                <li><Link href="/api" className="hover:text-white">API Reference</Link></li>
                <li><Link href="/enterprise" className="hover:text-white">Enterprise</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/security" className="hover:text-white">Security</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Connect</h3>
              <div className="flex space-x-4 mb-4">
                <Link href="https://github.com/ultra-dex" className="text-gray-400 hover:text-white">
                  <FiGithub className="h-6 w-6" />
                </Link>
                <Link href="https://twitter.com/ultra_dex" className="text-gray-400 hover:text-white">
                  <FiTwitter className="h-6 w-6" />
                </Link>
                <Link href="/docs" className="text-gray-400 hover:text-white">
                  <FiBook className="h-6 w-6" />
                </Link>
              </div>
              <div className="text-gray-400 text-sm">
                <p>Enterprise Support</p>
                <p>24/7 Availability</p>
                <p>SLA Guaranteed</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2026 Ultra-Dex. All rights reserved. Enterprise-grade AI orchestration platform.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;