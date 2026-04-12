import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import io from 'socket.io-client';
import AgentStatus from '../components/AgentStatus';
import MemoryGraph from '../components/MemoryGraph';

const Dashboard = () => {
  const [socket, setSocket] = useState(null);
  const [systemStatus, setSystemStatus] = useState({
    agents: [],
    memory: { hot: 0, warm: 0, cold: 0 },
    costs: { today: 0, month: 0 },
    logs: [],
  });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('Connected to Ultra-Dex server');
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from Ultra-Dex server');
    });

    // Listen for system updates
    newSocket.on('system-update', (data) => {
      setSystemStatus((prev) => ({
        ...prev,
        ...data,
      }));
    });

    newSocket.on('agent-status', (agents) => {
      setSystemStatus((prev) => ({
        ...prev,
        agents,
      }));
    });

    newSocket.on('memory-update', (memory) => {
      setSystemStatus((prev) => ({
        ...prev,
        memory,
      }));
    });

    newSocket.on('cost-update', (costs) => {
      setSystemStatus((prev) => ({
        ...prev,
        costs,
      }));
    });

    newSocket.on('log-entry', (log) => {
      setSystemStatus((prev) => ({
        ...prev,
        logs: [...prev.logs.slice(-49), log], // Keep last 50 logs
      }));
    });

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Head>
        <title>Ultra-Dex Dashboard</title>
        <meta name="description" content="AI Orchestration Dashboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <div className="bg-indigo-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">UD</span>
            </div>
            <h1 className="ml-3 text-2xl font-bold text-gray-900">Ultra-Dex Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            <div
              className={`h-3 w-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}
            ></div>
            <span className="text-sm text-gray-600">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Active Agents</h3>
            <p className="mt-2 text-3xl font-semibold text-indigo-600">
              {systemStatus.agents.length}
            </p>
            <p className="text-sm text-gray-500 mt-1">Currently running</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Memory Usage</h3>
            <p className="mt-2 text-3xl font-semibold text-indigo-600">
              {systemStatus.memory.hot + systemStatus.memory.warm + systemStatus.memory.cold}
            </p>
            <p className="text-sm text-gray-500 mt-1">Total entries</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Today's Cost</h3>
            <p className="mt-2 text-3xl font-semibold text-indigo-600">
              ${systemStatus.costs.today?.toFixed(2) || '0.00'}
            </p>
            <p className="text-sm text-gray-500 mt-1">Current billing period</p>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Agent Status Panel */}
          <div className="bg-white rounded-xl shadow">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Agent Status</h2>
            </div>
            <div className="p-6">
              <AgentStatus agents={systemStatus.agents} />
            </div>
          </div>

          {/* Memory Visualization */}
          <div className="bg-white rounded-xl shadow">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Memory Usage</h2>
            </div>
            <div className="p-6">
              <MemoryGraph memory={systemStatus.memory} />
            </div>
          </div>
        </div>

        {/* Real-time Logs */}
        <div className="mt-8 bg-white rounded-xl shadow">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Real-time Logs</h2>
          </div>
          <div className="p-6">
            <div className="bg-gray-900 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm">
              {systemStatus.logs.length > 0 ? (
                systemStatus.logs.map((log, index) => (
                  <div key={index} className="text-gray-300 mb-1">
                    <span className="text-green-400">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>{' '}
                    <span
                      className={`text-${log.level === 'error' ? 'red' : log.level === 'warn' ? 'yellow' : 'gray'}-${log.level === 'error' ? '300' : '400'}`}
                    >
                      {log.level.toUpperCase()}
                    </span>
                    : {log.message}
                  </div>
                ))
              ) : (
                <div className="text-gray-500 italic">Waiting for logs...</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
