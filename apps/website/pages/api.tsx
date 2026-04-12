import Head from 'next/head';
import { Terminal, ArrowRight, Copy, Check } from 'lucide-react';
import { useState } from 'react';

const ENDPOINTS = [
  {
    method: 'GET',
    path: '/v1/status',
    description: 'Check system status',
    example: 'curl https://api.ultra-dex.dev/v1/status \\n  -H "Authorization: Bearer $API_KEY"',
  },
  {
    method: 'POST',
    path: '/v1/workflows',
    description: 'Create new workflow',
    example: 'curl -X POST https://api.ultra-dex.dev/v1/workflows \\n  -H "Authorization: Bearer $API_KEY" \\n  -d \'{"name": "build", "steps": []}\'',
  },
  {
    method: 'POST',
    path: '/v1/execute',
    description: 'Execute workflow',
    example: 'curl -X POST https://api.ultra-dex.dev/v1/execute \\n  -H "Authorization: Bearer $API_KEY" \\n  -d \'{"workflow_id": "wf_123"}\'',
  },
];

function CodeExample({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative bg-[#0a0a0c] border border-[#2a2a35] p-4 font-mono text-sm group">
      <pre className="text-[#a0a0a8] overflow-x-auto"><code>{code}</code></pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 p-2 text-[#6b7280] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {copied ? <Check className="w-4 h-4 text-[#10b981]" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function Api() {
  return (
    <>
      <Head>
        <title>API Reference — Ultra-Dex</title>
        <meta name="description" content="Ultra-Dex API documentation" />
      </Head>

      {/* Hero */}
      <section className="py-24 border-b border-[#2a2a35]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="text-xs font-mono text-[#00d4ff] uppercase tracking-widest mb-4">
              API Reference
            </div>
            <h1 className="text-4xl sm:text-5xl font-semibold text-white mb-6">
              REST API
            </h1>
            <p className="text-lg text-[#6b7280]">
              Integrate Ultra-Dex into your applications with our HTTP API.
            </p>
          </div>
        </div>
      </section>

      {/* Auth */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <h2 className="text-2xl font-semibold text-white mb-4">Authentication</h2>
            <p className="text-[#6b7280] mb-6">
              Include your API key in the Authorization header.
            </p>
            <CodeExample code="Authorization: Bearer YOUR_API_KEY" />
          </div>

          {/* Endpoints */}
          <h2 className="text-2xl font-semibold text-white mb-8">Endpoints</h2>
          <div className="space-y-6">
            {ENDPOINTS.map((endpoint) => (
              <div
                key={endpoint.path}
                className="bg-[#141418] border border-[#2a2a35] p-6"
              >
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span
                    className={`px-2 py-1 text-xs font-mono font-semibold ${
                      endpoint.method === 'GET'
                        ? 'bg-[#10b981]/20 text-[#10b981]'
                        : 'bg-[#00d4ff]/20 text-[#00d4ff]'
                    }`}
                  >
                    {endpoint.method}
                  </span>
                  <code className="text-white font-mono">{endpoint.path}</code>
                </div>
                <p className="text-[#6b7280] mb-4">{endpoint.description}</p>
                <CodeExample code={endpoint.example} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
