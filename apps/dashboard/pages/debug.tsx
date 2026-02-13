import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import io from 'socket.io-client';
import ExecutionFlow from '../components/ExecutionFlow';

const DebugPage = () => {
  const [socket, setSocket] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [selectedExecution, setSelectedExecution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000');

    newSocket.on('connect', () => {
      console.log('Connected to debug endpoint');
    });

    newSocket.on('execution-update', (data) => {
      setExecutions(data);
      setLoading(false);
    });

    // Simulate initial data if socket doesn't connect quickly
    const timer = setTimeout(() => {
      if (executions.length === 0) {
        setExecutions([
          {
            id: 'exec-12345',
            status: 'running',
            startedAt: new Date(Date.now() - 300000), // 5 minutes ago
            completedSteps: 3,
            totalSteps: 7,
            task: 'Create Express server with health endpoint',
            progress: 43
          },
          {
            id: 'exec-67890',
            status: 'completed',
            startedAt: new Date(Date.now() - 1200000), // 20 minutes ago
            completedSteps: 7,
            totalSteps: 7,
            task: 'Implement user authentication system',
            progress: 100
          },
          {
            id: 'exec-54321',
            status: 'error',
            startedAt: new Date(Date.now() - 600000), // 10 minutes ago
            completedSteps: 2,
            totalSteps: 7,
            task: 'Deploy application to production',
            progress: 29
          },
          {
            id: 'exec-98765',
            status: 'paused',
            startedAt: new Date(Date.now() - 900000), // 15 minutes ago
            completedSteps: 4,
            totalSteps: 7,
            task: 'Generate documentation for API',
            progress: 57
          }
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

  const filteredExecutions = executions.filter(exec => {
    if (filter === 'all') return true;
    return exec.status === filter;
  });

  const statusCounts = {
    all: executions.length,
    running: executions.filter(e => e.status === 'running').length,
    completed: executions.filter(e => e.status === 'completed').length,
    error: executions.filter(e => e.status === 'error').length,
    paused: executions.filter(e => e.status === 'paused').length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Debug - Ultra-Dex Dashboard</title>
        <meta name="description" content="Debug Ultra-Dex executions" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Execution Debugger</h1>
          <p className="mt-2 text-gray-600">Visualize and debug agent execution flows</p>
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

        {/* Executions List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Execution List */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Active Executions</h2>
              
              {loading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Connecting to execution debugger...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredExecutions.map((execution) => (
                    <div 
                      key={execution.id} 
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedExecution?.id === execution.id 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedExecution(execution)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center">
                            <h3 className="font-medium text-gray-900">{execution.task}</h3>
                            <span className={`ml-2 text-xs px-2 py-1 rounded-full ${
                              execution.status === 'running' ? 'bg-blue-100 text-blue-800' :
                              execution.status === 'completed' ? 'bg-green-100 text-green-800' :
                              execution.status === 'error' ? 'bg-red-100 text-red-800' :
                              execution.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {execution.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">ID: {execution.id}</p>
                          <p className="text-sm text-gray-500">Started: {new Date(execution.startedAt).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{execution.progress}%</div>
                          <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className={`h-2 rounded-full ${
                                execution.status === 'error' ? 'bg-red-500' :
                                execution.status === 'completed' ? 'bg-green-500' :
                                'bg-indigo-500'
                              }`}
                              style={{ width: `${execution.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredExecutions.length === 0 && !loading && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No executions found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try changing your filters or start a new execution.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Execution Flow Visualization */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Execution Flow</h2>
              
              {selectedExecution ? (
                <ExecutionFlow executionData={{
                  id: selectedExecution.id,
                  status: selectedExecution.status,
                  startedAt: selectedExecution.startedAt,
                  completedSteps: selectedExecution.completedSteps,
                  totalSteps: selectedExecution.totalSteps,
                  steps: [
                    {
                      id: 'step-1',
                      name: 'Task Analysis',
                      status: selectedExecution.completedSteps >= 1 ? 'completed' : selectedExecution.status === 'running' ? 'running' : 'pending',
                      duration: selectedExecution.completedSteps >= 1 ? 1200 : null,
                      startedAt: new Date(selectedExecution.startedAt.getTime() - 300000),
                      completedAt: selectedExecution.completedSteps >= 1 ? new Date(selectedExecution.startedAt.getTime() - 298800) : null,
                      agent: 'planner',
                      input: selectedExecution.task,
                      output: selectedExecution.completedSteps >= 1 ? 'Task broken down into subtasks' : null,
                      metadata: { tokens: 45, model: 'gpt-4o' }
                    },
                    {
                      id: 'step-2',
                      name: 'Architecture Design',
                      status: selectedExecution.completedSteps >= 2 ? 'completed' : selectedExecution.status === 'running' && selectedExecution.completedSteps >= 1 ? 'running' : 'pending',
                      duration: selectedExecution.completedSteps >= 2 ? 2100 : null,
                      startedAt: selectedExecution.completedSteps >= 2 ? new Date(selectedExecution.startedAt.getTime() - 298000) : null,
                      completedAt: selectedExecution.completedSteps >= 2 ? new Date(selectedExecution.startedAt.getTime() - 295900) : null,
                      agent: 'architect',
                      input: 'Design system architecture',
                      output: selectedExecution.completedSteps >= 2 ? 'Proposed architecture' : null,
                      metadata: { tokens: 120, model: 'claude-3-5-sonnet' }
                    },
                    {
                      id: 'step-3',
                      name: 'Code Generation',
                      status: selectedExecution.completedSteps >= 3 ? 'completed' : selectedExecution.status === 'running' && selectedExecution.completedSteps >= 2 ? 'running' : 'pending',
                      duration: selectedExecution.completedSteps >= 3 ? 3500 : null,
                      startedAt: selectedExecution.completedSteps >= 3 ? new Date(selectedExecution.startedAt.getTime() - 295000) : null,
                      completedAt: selectedExecution.completedSteps >= 3 ? new Date(selectedExecution.startedAt.getTime() - 291500) : null,
                      agent: 'backend',
                      input: 'Generate code',
                      output: selectedExecution.completedSteps >= 3 ? 'Generated code' : null,
                      metadata: { tokens: 210, model: 'gpt-4o' }
                    },
                    {
                      id: 'step-4',
                      name: 'Code Review',
                      status: selectedExecution.completedSteps >= 4 ? 'completed' : selectedExecution.status === 'running' && selectedExecution.completedSteps >= 3 ? 'running' : 'pending',
                      duration: selectedExecution.completedSteps >= 4 ? 1800 : null,
                      startedAt: selectedExecution.completedSteps >= 4 ? new Date(selectedExecution.startedAt.getTime() - 290000) : null,
                      completedAt: selectedExecution.completedSteps >= 4 ? new Date(selectedExecution.startedAt.getTime() - 288200) : null,
                      agent: 'reviewer',
                      input: 'Review generated code',
                      output: selectedExecution.completedSteps >= 4 ? 'Code review completed' : null,
                      metadata: { tokens: 95, model: 'gpt-4o' }
                    },
                    {
                      id: 'step-5',
                      name: 'Testing',
                      status: selectedExecution.completedSteps >= 5 ? 'completed' : selectedExecution.status === 'running' && selectedExecution.completedSteps >= 4 ? 'running' : 'pending',
                      duration: selectedExecution.completedSteps >= 5 ? 4200 : null,
                      startedAt: selectedExecution.completedSteps >= 5 ? new Date(selectedExecution.startedAt.getTime() - 285000) : null,
                      completedAt: selectedExecution.completedSteps >= 5 ? new Date(selectedExecution.startedAt.getTime() - 280800) : null,
                      agent: 'tester',
                      input: 'Write and run tests',
                      output: selectedExecution.completedSteps >= 5 ? 'Tests passed' : null,
                      metadata: { tokens: 150, model: 'gpt-4o' }
                    },
                    {
                      id: 'step-6',
                      name: 'Documentation',
                      status: selectedExecution.completedSteps >= 6 ? 'completed' : selectedExecution.status === 'running' && selectedExecution.completedSteps >= 5 ? 'running' : 'pending',
                      duration: selectedExecution.completedSteps >= 6 ? 2800 : null,
                      startedAt: selectedExecution.completedSteps >= 6 ? new Date(selectedExecution.startedAt.getTime() - 278000) : null,
                      completedAt: selectedExecution.completedSteps >= 6 ? new Date(selectedExecution.startedAt.getTime() - 275200) : null,
                      agent: 'documenter',
                      input: 'Generate documentation',
                      output: selectedExecution.completedSteps >= 6 ? 'Documentation generated' : null,
                      metadata: { tokens: 80, model: 'gpt-4o' }
                    },
                    {
                      id: 'step-7',
                      name: 'Deployment',
                      status: selectedExecution.completedSteps >= 7 ? 'completed' : selectedExecution.status === 'running' && selectedExecution.completedSteps >= 6 ? 'running' : 'pending',
                      duration: selectedExecution.completedSteps >= 7 ? 5600 : null,
                      startedAt: selectedExecution.completedSteps >= 7 ? new Date(selectedExecution.startedAt.getTime() - 270000) : null,
                      completedAt: selectedExecution.completedSteps >= 7 ? new Date(selectedExecution.startedAt.getTime() - 264400) : null,
                      agent: 'deployer',
                      input: 'Deploy to production',
                      output: selectedExecution.completedSteps >= 7 ? 'Successfully deployed' : null,
                      metadata: { tokens: 120, model: 'gpt-4o' }
                    }
                  ]
                }} />
              ) : (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Select an execution</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Choose an execution from the list to visualize its flow.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Performance Profiling */}
        <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Performance Profiling</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900">Average Response Time</h3>
                <p className="text-2xl font-semibold text-indigo-600 mt-2">1.24s</p>
                <p className="text-sm text-gray-500 mt-1">Across all agents</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900">Tokens Consumed</h3>
                <p className="text-2xl font-semibold text-indigo-600 mt-2">245,678</p>
                <p className="text-sm text-gray-500 mt-1">This execution</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900">Cost</h3>
                <p className="text-2xl font-semibold text-indigo-600 mt-2">$2.45</p>
                <p className="text-sm text-gray-500 mt-1">Estimated</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;