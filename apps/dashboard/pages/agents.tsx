import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import io from 'socket.io-client';
import AgentStatus from '../components/AgentStatus';

const AgentsPage = () => {
  const [socket, setSocket] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000');

    newSocket.on('connect', () => {
      console.log('Connected to agents endpoint');
    });

    newSocket.on('agent-status', (updatedAgents) => {
      setAgents(updatedAgents);
      setLoading(false);
    });

    // Simulate initial data if socket doesn't connect quickly
    const timer = setTimeout(() => {
      if (agents.length === 0) {
        setAgents([
          { id: 'planner', name: 'Project Planner', status: 'active', tasks: 2, lastActive: '2 min ago', description: 'Breaks down complex tasks into manageable steps' },
          { id: 'cto', name: 'System Architect', status: 'idle', tasks: 0, lastActive: '5 min ago', description: 'Designs system architecture and technology stack' },
          { id: 'backend', name: 'Backend Developer', status: 'active', tasks: 1, lastActive: '1 min ago', description: 'Implements server-side logic and APIs' },
          { id: 'frontend', name: 'Frontend Developer', status: 'error', tasks: 0, lastActive: '10 min ago', description: 'Creates user interfaces and experiences' },
          { id: 'reviewer', name: 'Code Reviewer', status: 'active', tasks: 3, lastActive: '30 sec ago', description: 'Reviews code for quality and security' },
          { id: 'security', name: 'Security Auditor', status: 'warning', tasks: 1, lastActive: '1 min ago', description: 'Audits code for security vulnerabilities' },
          { id: 'tester', name: 'QA Engineer', status: 'idle', tasks: 0, lastActive: '3 min ago', description: 'Writes and executes test cases' },
          { id: 'deployer', name: 'Deployment Manager', status: 'active', tasks: 1, lastActive: '45 sec ago', description: 'Manages deployment and release processes' },
        ]);
        setLoading(false);
      }
    }, 2000);

    setSocket(newSocket);

    return () => {
      clearTimeout(timer);
      newSocket.close();
    };
  }, []);

  const filteredAgents = agents.filter(agent => {
    if (filter === 'all') return true;
    return agent.status === filter;
  });

  const statusCounts = {
    all: agents.length,
    active: agents.filter(a => a.status === 'active').length,
    idle: agents.filter(a => a.status === 'idle').length,
    error: agents.filter(a => a.status === 'error').length,
    warning: agents.filter(a => a.status === 'warning').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Agents - Ultra-Dex Dashboard</title>
        <meta name="description" content="Manage Ultra-Dex AI agents" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI Agents</h1>
          <p className="mt-2 text-gray-600">Monitor and manage your AI agent workforce</p>
        </div>

        {/* Status Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusCounts).map(([status, count]) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  filter === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)} ({count})
              </button>
            ))}
          </div>
        </div>

        {/* Agents List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Connecting to Ultra-Dex agents...</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredAgents.map((agent) => (
                <li key={agent.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className={`w-4 h-4 rounded-full ${
                          agent.status === 'active' ? 'bg-green-500' :
                          agent.status === 'idle' ? 'bg-gray-500' :
                          agent.status === 'error' ? 'bg-red-500' :
                          'bg-yellow-500'
                        }`}></div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900">{agent.name}</h3>
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {agent.id}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{agent.description}</p>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
                            agent.status === 'active' ? 'bg-green-500' :
                            agent.status === 'idle' ? 'bg-gray-500' :
                            agent.status === 'error' ? 'bg-red-500' :
                            'bg-yellow-500'
                          }`}></span>
                          <span className="capitalize">{agent.status}</span>
                          <span className="mx-2">•</span>
                          <span>{agent.tasks} active tasks</span>
                          <span className="mx-2">•</span>
                          <span>Last active: {agent.lastActive}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
                        Inspect
                      </button>
                      <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50">
                        Logs
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {filteredAgents.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No agents found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try changing your filters or check agent connectivity.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentsPage;