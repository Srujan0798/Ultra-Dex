import Head from 'next/head';
import Link from 'next/link';
import { FiMail, FiPhone, FiMapPin, FiClock, FiGlobe, FiTwitter, FiGithub, FiLinkedin, FiSend, FiCheck, FiUser, FiBriefcase, FiMessageSquare, FiArrowRight } from 'react-icons/fi';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      // Reset form after successful submission
      setFormData({ name: '', email: '', company: '', message: '' });
    }, 1500);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const contactMethods = [
    {
      icon: <FiMail className="h-6 w-6" />,
      title: 'Email',
      value: 'hello@ultra-dex.ai',
      description: 'General inquiries and support'
    },
    {
      icon: <FiPhone className="h-6 w-6" />,
      title: 'Phone',
      value: '+1 (800) DEX-HELP',
      description: 'Enterprise sales and support'
    },
    {
      icon: <FiMapPin className="h-6 w-6" />,
      title: 'Office',
      value: 'San Francisco, CA',
      description: 'Headquarters location'
    },
    {
      icon: <FiClock className="h-6 w-6" />,
      title: 'Support Hours',
      value: '24/7 Enterprise',
      description: 'Priority support for enterprise customers'
    }
  ];

  const enterpriseContacts = [
    { name: 'Enterprise Sales', email: 'enterprise@ultra-dex.ai', phone: '1-800-DEX-ENT' },
    { name: 'Technical Support', email: 'support@ultra-dex.ai', phone: '1-800-DEX-SUPPORT' },
    { name: 'Security Team', email: 'security@ultra-dex.ai', phone: '1-800-DEX-SECURE' },
    { name: 'Compliance', email: 'compliance@ultra-dex.ai', phone: '1-800-DEX-COMPLY' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Contact Us - Ultra-Dex AI Orchestration</title>
        <meta name="description" content="Get in touch with the Ultra-Dex team" />
      </Head>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-gray-900 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Get in Touch with <span className="text-indigo-300">Ultra-Dex</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Have questions about our AI orchestration platform? Want to discuss enterprise deployment? 
              Our team is here to help.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Contact Information</h2>
            
            <div className="space-y-6">
              {contactMethods.map((method, index) => (
                <div key={index} className="flex items-start">
                  <div className="bg-indigo-100 text-indigo-600 p-3 rounded-lg mr-4">
                    {method.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{method.title}</h3>
                    <p className="text-gray-900 font-medium">{method.value}</p>
                    <p className="text-gray-600">{method.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Enterprise Contacts */}
            <div className="mt-12">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Enterprise Contacts</h3>
              <div className="space-y-4">
                {enterpriseContacts.map((contact, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-sm p-4">
                    <h4 className="font-medium text-gray-900">{contact.name}</h4>
                    <p className="text-indigo-600">{contact.email}</p>
                    <p className="text-gray-600">{contact.phone}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-12">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Connect With Us</h3>
              <div className="flex space-x-6">
                <Link href="https://twitter.com/ultra_dex" className="bg-gray-100 p-3 rounded-full text-gray-600 hover:text-indigo-600 hover:bg-indigo-50">
                  <FiTwitter className="h-5 w-5" />
                </Link>
                <Link href="https://github.com/ultra-dex" className="bg-gray-100 p-3 rounded-full text-gray-600 hover:text-indigo-600 hover:bg-indigo-50">
                  <FiGithub className="h-5 w-5" />
                </Link>
                <Link href="https://linkedin.com/company/ultra-dex" className="bg-gray-100 p-3 rounded-full text-gray-600 hover:text-indigo-600 hover:bg-indigo-50">
                  <FiLinkedin className="h-5 w-5" />
                </Link>
                <Link href="https://ultra-dex.ai/discord" className="bg-gray-100 p-3 rounded-full text-gray-600 hover:text-indigo-600 hover:bg-indigo-50">
                  <FiMessageSquare className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Send us a message</h2>
            
            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                <FiCheck className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-green-800 mb-2">Message Sent!</h3>
                <p className="text-green-700">
                  Thank you for contacting us. Our team will get back to you within 24 hours.
                </p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="mt-6 bg-indigo-600 text-white px-6 py-3 rounded-md font-medium hover:bg-indigo-700"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
                <div className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiUser className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiMail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                      Company (Optional)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiBriefcase className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Acme Corporation"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="block w-full px-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Tell us about your project or ask any questions..."
                    ></textarea>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="privacy-consent"
                      name="privacy-consent"
                      type="checkbox"
                      required
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="privacy-consent" className="ml-2 block text-sm text-gray-900">
                      I agree to the <Link href="/privacy" className="text-indigo-600 hover:underline">Privacy Policy</Link> and consent to Ultra-Dex contacting me.
                    </label>
                  </div>
                  
                  <div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                        submitting 
                          ? 'bg-indigo-400 cursor-not-allowed' 
                          : 'bg-indigo-600 hover:bg-indigo-700'
                      }`}
                    >
                      {submitting ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </>
                      ) : (
                        <>
                          <FiSend className="mr-2" />
                          Send Message
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-20">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                question: 'How does Ultra-Dex ensure enterprise security?',
                answer: 'Ultra-Dex implements SOC 2 Type II controls, SAML 2.0/OIDC SSO, RBAC, audit logging, and end-to-end encryption. We provide comprehensive security documentation and compliance reports.'
              },
              {
                question: 'What AI providers do you support?',
                answer: 'We support OpenAI, Anthropic, Google, Ollama, Azure OpenAI, AWS Bedrock, and custom providers. Our unified interface makes it easy to switch between providers or use multiple simultaneously.'
              },
              {
                question: 'Can Ultra-Dex run on-premise?',
                answer: 'Yes, Ultra-Dex supports on-premise, private cloud, and hybrid deployment models. Our enterprise edition includes dedicated support for air-gapped environments.'
              },
              {
                question: 'How does the multi-agent orchestration work?',
                answer: 'Our Nexus orchestrator coordinates specialized agents (planner, architect, backend, etc.) using a "Think-Act-Verify" loop. Each agent has specific capabilities and communicates through our MCP protocol.'
              },
              {
                question: 'What kind of support do you offer?',
                answer: 'We offer tiered support from community forums to 24/7 dedicated enterprise support with SLA guarantees. Our enterprise customers receive dedicated customer success managers.'
              },
              {
                question: 'How do you handle data privacy and compliance?',
                answer: 'We implement GDPR, CCPA, and other privacy regulations by design. Data residency controls, right to deletion, and comprehensive audit logs ensure compliance with your requirements.'
              },
              {
                question: 'What are the pricing options?',
                answer: 'We offer flexible pricing from free tier for individuals to custom enterprise plans. Our pricing is based on usage with transparent per-task or per-month options.'
              },
              {
                question: 'How do I migrate from other AI orchestration tools?',
                answer: 'We provide migration tools and services to help you transition from other platforms. Our API is designed to be compatible with existing integrations, minimizing disruption.'
              }
            ].map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Enterprise CTA */}
        <div className="mt-20 bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready for Enterprise Deployment?</h2>
          <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-8">
            Schedule a personalized demo with our enterprise team to see how Ultra-Dex can transform your AI development workflow.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/enterprise" className="bg-white text-indigo-600 px-8 py-4 rounded-lg text-lg font-medium hover:bg-gray-100 flex items-center justify-center">
              <FiBriefcase className="mr-2" />
              Enterprise Solutions
            </Link>
            <Link href="/demo" className="bg-indigo-800 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-indigo-900 flex items-center justify-center">
              <FiVideo className="mr-2" />
              Schedule Demo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}