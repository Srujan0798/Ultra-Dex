import Head from 'next/head';
import Link from 'next/link';

export default function ApiReference() {
  const endpoints = [
    {
      method: 'GET',
      path: '/v1/status',
      description: 'Check the status of the Ultra-Dex system',
      example: `curl -X GET https://api.ultra-dex.dev/v1/status \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
      response: `{
  "status": "healthy",
  "timestamp": "2026-02-15T10:30:00Z",
  "version": "6.0.0",
  "services": {
    "memory": "operational",
    "agents": "operational",
    "providers": "operational"
  }
}`
    },
    {
      method: 'POST',
      path: '/v1/agents/{agent_id}/execute',
      description: 'Execute a specific agent with a task',
      example: `curl -X POST https://api.ultra-dex.dev/v1/agents/planner/execute \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "task": "Plan a simple web application",
    "context": "We need a todo list app with user authentication",
    "options": {
      "temperature": 0.7,
      "max_tokens": 1000
    }
  }'`,
      response: `{
  "id": "exec_abc123",
  "agent_id": "planner",
  "status": "completed",
  "result": "Detailed plan...",
  "usage": {
    "input_tokens": 150,
    "output_tokens": 420,
    "cost_usd": 0.02
  }
}`
    },
    {
      method: 'POST',
      path: '/v1/memory',
      description: 'Store information in the persistent memory system',
      example: `curl -X POST https://api.ultra-dex.dev/v1/memory \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "key": "project_requirements",
    "value": "Todo app with user auth",
    "tags": ["requirement", "todo-app"],
    "ttl": 86400
  }'`,
      response: `{
  "success": true,
  "key": "project_requirements",
  "stored_at": "2026-02-15T10:30:00Z"
}`
    },
    {
      method: 'GET',
      path: '/v1/memory/{key}',
      description: 'Retrieve information from the memory system',
      example: `curl -X GET https://api.ultra-dex.dev/v1/memory/project_requirements \\
  -H "Authorization: Bearer YOUR_API_KEY"`,
      response: `{
  "key": "project_requirements",
  "value": "Todo app with user auth",
  "tags": ["requirement", "todo-app"],
  "created_at": "2026-02-15T10:30:00Z",
  "expires_at": "2026-02-16T10:30:00Z"
}`
    },
    {
      method: 'POST',
      path: '/v1/swarm',
      description: 'Execute a multi-agent swarm for complex tasks',
      example: `curl -X POST https://api.ultra-dex.dev/v1/swarm \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "task": "Build a simple web application",
    "agents": ["planner", "backend", "frontend", "reviewer"],
    "context": "We need a todo list app with user authentication",
    "options": {
      "parallel": true,
      "max_workers": 4
    }
  }'`,
      response: `{
  "id": "swarm_def456",
  "status": "running",
  "agents": ["planner", "backend", "frontend", "reviewer"],
  "progress": 0.25,
  "results": {}
}`
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <Head>
        <title>Ultra-Dex API Reference | Complete API Documentation</title>
        <meta name="description" content="Complete API reference for Ultra-Dex AI orchestration platform" />
        <meta name="keywords" content="Ultra-Dex API, AI orchestration API, multi-agent system API" />
        <link rel="canonical" href="https://ultra-dex.dev/api" />
      </Head>

      <section className="py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              API <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Reference</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Complete API documentation for integrating with Ultra-Dex
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-700 sticky top-6">
                <h2 className="text-xl font-bold mb-6 text-blue-400">Endpoints</h2>
                <nav className="space-y-2">
                  <a href="#authentication" className="block py-2 px-3 rounded-lg hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white">
                    Authentication
                  </a>
                  <a href="#agents" className="block py-2 px-3 rounded-lg hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white">
                    Agents
                  </a>
                  <a href="#memory" className="block py-2 px-3 rounded-lg hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white">
                    Memory
                  </a>
                  <a href="#swarm" className="block py-2 px-3 rounded-lg hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white">
                    Swarm
                  </a>
                  <a href="#status" className="block py-2 px-3 rounded-lg hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white">
                    Status
                  </a>
                  <a href="#errors" className="block py-2 px-3 rounded-lg hover:bg-gray-700/50 transition-colors text-gray-400 hover:text-white">
                    Errors
                  </a>
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700">
                <h2 id="authentication" className="text-3xl font-bold mb-6 text-blue-400">Authentication</h2>
                <p className="text-gray-300 mb-6">
                  All API requests require authentication via an API key. Include your API key in the Authorization header of each request.
                </p>
                
                <div className="bg-gray-900/50 rounded-xl p-4 mb-8">
                  <pre className="text-sm text-gray-300 overflow-x-auto">
                    {`curl -X GET https://api.ultra-dex.dev/v1/status \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
                  </pre>
                </div>

                <h2 id="agents" className="text-3xl font-bold mb-6 text-blue-400 mt-12">Agents</h2>
                <p className="text-gray-300 mb-6">
                  Manage and interact with AI agents through the agents API.
                </p>
                
                {endpoints.filter(e => e.path.includes('/agents')).map((endpoint, index) => (
                  <div key={index} className="mb-8">
                    <div className="flex items-center mb-4">
                      <span className={`px-3 py-1 rounded font-bold text-sm mr-3 ${
                        endpoint.method === 'GET' ? 'bg-green-900/30 text-green-400' :
                        endpoint.method === 'POST' ? 'bg-blue-900/30 text-blue-400' :
                        endpoint.method === 'PUT' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-red-900/30 text-red-400'
                      }`}>
                        {endpoint.method}
                      </span>
                      <code className="text-lg font-mono">{endpoint.path}</code>
                    </div>
                    <p className="text-gray-300 mb-4">{endpoint.description}</p>
                    
                    <h3 className="font-bold text-white mb-2">Example Request:</h3>
                    <pre className="bg-gray-900/50 rounded-lg p-4 text-sm overflow-x-auto mb-4">
                      <code className="text-gray-300">{endpoint.example}</code>
                    </pre>
                    
                    <h3 className="font-bold text-white mb-2">Example Response:</h3>
                    <pre className="bg-gray-900/50 rounded-lg p-4 text-sm overflow-x-auto">
                      <code className="text-gray-300">{endpoint.response}</code>
                    </pre>
                  </div>
                ))}

                <h2 id="memory" className="text-3xl font-bold mb-6 text-blue-400 mt-12">Memory</h2>
                <p className="text-gray-300 mb-6">
                  Interact with the persistent memory system to store and retrieve information.
                </p>
                
                {endpoints.filter(e => e.path.includes('/memory')).map((endpoint, index) => (
                  <div key={index} className="mb-8">
                    <div className="flex items-center mb-4">
                      <span className={`px-3 py-1 rounded font-bold text-sm mr-3 ${
                        endpoint.method === 'GET' ? 'bg-green-900/30 text-green-400' :
                        endpoint.method === 'POST' ? 'bg-blue-900/30 text-blue-400' :
                        endpoint.method === 'PUT' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-red-900/30 text-red-400'
                      }`}>
                        {endpoint.method}
                      </span>
                      <code className="text-lg font-mono">{endpoint.path}</code>
                    </div>
                    <p className="text-gray-300 mb-4">{endpoint.description}</p>
                    
                    <h3 className="font-bold text-white mb-2">Example Request:</h3>
                    <pre className="bg-gray-900/50 rounded-lg p-4 text-sm overflow-x-auto mb-4">
                      <code className="text-gray-300">{endpoint.example}</code>
                    </pre>
                    
                    <h3 className="font-bold text-white mb-2">Example Response:</h3>
                    <pre className="bg-gray-900/50 rounded-lg p-4 text-sm overflow-x-auto">
                      <code className="text-gray-300">{endpoint.response}</code>
                    </pre>
                  </div>
                ))}

                <h2 id="swarm" className="text-3xl font-bold mb-6 text-blue-400 mt-12">Swarm</h2>
                <p className="text-gray-300 mb-6">
                  Execute multi-agent swarms for complex tasks.
                </p>
                
                {endpoints.filter(e => e.path.includes('/swarm')).map((endpoint, index) => (
                  <div key={index} className="mb-8">
                    <div className="flex items-center mb-4">
                      <span className={`px-3 py-1 rounded font-bold text-sm mr-3 ${
                        endpoint.method === 'GET' ? 'bg-green-900/30 text-green-400' :
                        endpoint.method === 'POST' ? 'bg-blue-900/30 text-blue-400' :
                        endpoint.method === 'PUT' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-red-900/30 text-red-400'
                      }`}>
                        {endpoint.method}
                      </span>
                      <code className="text-lg font-mono">{endpoint.path}</code>
                    </div>
                    <p className="text-gray-300 mb-4">{endpoint.description}</p>
                    
                    <h3 className="font-bold text-white mb-2">Example Request:</h3>
                    <pre className="bg-gray-900/50 rounded-lg p-4 text-sm overflow-x-auto mb-4">
                      <code className="text-gray-300">{endpoint.example}</code>
                    </pre>
                    
                    <h3 className="font-bold text-white mb-2">Example Response:</h3>
                    <pre className="bg-gray-900/50 rounded-lg p-4 text-sm overflow-x-auto">
                      <code className="text-gray-300">{endpoint.response}</code>
                    </pre>
                  </div>
                ))}

                <h2 id="status" className="text-3xl font-bold mb-6 text-blue-400 mt-12">Status</h2>
                <p className="text-gray-300 mb-6">
                  Check the status of the Ultra-Dex system and connected services.
                </p>
                
                {endpoints.filter(e => e.path.includes('/status')).map((endpoint, index) => (
                  <div key={index} className="mb-8">
                    <div className="flex items-center mb-4">
                      <span className={`px-3 py-1 rounded font-bold text-sm mr-3 ${
                        endpoint.method === 'GET' ? 'bg-green-900/30 text-green-400' :
                        endpoint.method === 'POST' ? 'bg-blue-900/30 text-blue-400' :
                        endpoint.method === 'PUT' ? 'bg-yellow-900/30 text-yellow-400' :
                        'bg-red-900/30 text-red-400'
                      }`}>
                        {endpoint.method}
                      </span>
                      <code className="text-lg font-mono">{endpoint.path}</code>
                    </div>
                    <p className="text-gray-300 mb-4">{endpoint.description}</p>
                    
                    <h3 className="font-bold text-white mb-2">Example Request:</h3>
                    <pre className="bg-gray-900/50 rounded-lg p-4 text-sm overflow-x-auto mb-4">
                      <code className="text-gray-300">{endpoint.example}</code>
                    </pre>
                    
                    <h3 className="font-bold text-white mb-2">Example Response:</h3>
                    <pre className="bg-gray-900/50 rounded-lg p-4 text-sm overflow-x-auto">
                      <code className="text-gray-300">{endpoint.response}</code>
                    </pre>
                  </div>
                ))}

                <h2 id="errors" className="text-3xl font-bold mb-6 text-blue-400 mt-12">Errors</h2>
                <p className="text-gray-300 mb-6">
                  The Ultra-Dex API uses conventional HTTP response codes to indicate the success or failure of an API request.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-gray-900/50 p-6 rounded-xl">
                    <h3 className="font-bold text-green-400 mb-2">Success Codes</h3>
                    <ul className="text-gray-300 space-y-2">
                      <li><span className="text-green-500">200 OK</span> - Request succeeded</li>
                      <li><span className="text-green-500">201 Created</span> - Resource created</li>
                      <li><span className="text-green-500">204 No Content</span> - Request succeeded, no content returned</li>
                    </ul>
                  </div>
                  <div className="bg-gray-900/50 p-6 rounded-xl">
                    <h3 className="font-bold text-red-400 mb-2">Error Codes</h3>
                    <ul className="text-gray-300 space-y-2">
                      <li><span className="text-red-500">400 Bad Request</span> - Invalid request</li>
                      <li><span className="text-red-500">401 Unauthorized</span> - Invalid API key</li>
                      <li><span className="text-red-500">404 Not Found</span> - Resource not found</li>
                      <li><span className="text-red-500">429 Too Many Requests</span> - Rate limit exceeded</li>
                      <li><span className="text-red-500">500 Server Error</span> - Server error</li>
                    </ul>
                  </div>
                </div>

                <div className="mt-12 p-6 bg-blue-900/20 border border-blue-700 rounded-xl">
                  <h3 className="text-xl font-bold text-blue-400 mb-2">Rate Limits</h3>
                  <p className="text-gray-300">
                    All API endpoints have rate limits. Free accounts: 100 requests/hour. 
                    Pro accounts: 1,000 requests/hour. Enterprise accounts: 10,000 requests/hour.
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