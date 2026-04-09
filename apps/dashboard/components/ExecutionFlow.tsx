import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiInfo,
  FiPlay,
  FiPause,
  FiRefreshCw,
} from 'react-icons/fi';

const ExecutionFlow = ({ executionData = null }) => {
  const [selectedStep, setSelectedStep] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [executionSpeed, setExecutionSpeed] = useState(1);

  // Sample execution data if none provided
  const sampleExecutionData = {
    id: 'exec-12345',
    status: 'running',
    startedAt: new Date(Date.now() - 300000), // 5 minutes ago
    completedSteps: 3,
    totalSteps: 7,
    steps: [
      {
        id: 'step-1',
        name: 'Task Analysis',
        status: 'completed',
        duration: 1200,
        startedAt: new Date(Date.now() - 300000),
        completedAt: new Date(Date.now() - 298800),
        agent: 'planner',
        input: 'Create a simple Express server with health endpoint',
        output: 'Task broken down into 7 subtasks',
        metadata: { tokens: 45, model: 'gpt-4o' },
      },
      {
        id: 'step-2',
        name: 'Architecture Design',
        status: 'completed',
        duration: 2100,
        startedAt: new Date(Date.now() - 298000),
        completedAt: new Date(Date.now() - 295900),
        agent: 'architect',
        input: 'Design system architecture for Express server',
        output: 'Proposed architecture with middleware, routes, controllers',
        metadata: { tokens: 120, model: 'claude-3-5-sonnet' },
      },
      {
        id: 'step-3',
        name: 'Code Generation',
        status: 'completed',
        duration: 3500,
        startedAt: new Date(Date.now() - 295000),
        completedAt: new Date(Date.now() - 291500),
        agent: 'backend',
        input: 'Generate Express server code with health endpoint',
        output: 'Generated server.js with health route',
        metadata: { tokens: 210, model: 'gpt-4o' },
      },
      {
        id: 'step-4',
        name: 'Code Review',
        status: 'running',
        duration: 1800,
        startedAt: new Date(Date.now() - 290000),
        agent: 'reviewer',
        input: 'Review generated Express server code',
        output: null,
        metadata: { tokens: 0, model: 'gpt-4o' },
      },
      {
        id: 'step-5',
        name: 'Testing',
        status: 'pending',
        agent: 'tester',
        input: 'Write and run tests for health endpoint',
        output: null,
        metadata: { tokens: 0, model: 'gpt-4o' },
      },
      {
        id: 'step-6',
        name: 'Documentation',
        status: 'pending',
        agent: 'documenter',
        input: 'Generate API documentation',
        output: null,
        metadata: { tokens: 0, model: 'gpt-4o' },
      },
      {
        id: 'step-7',
        name: 'Deployment',
        status: 'pending',
        agent: 'deployer',
        input: 'Deploy server to production',
        output: null,
        metadata: { tokens: 0, model: 'gpt-4o' },
      },
    ],
  };

  const data = executionData || sampleExecutionData;

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'running':
        return 'bg-blue-500 animate-pulse';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'pending':
        return 'bg-gray-300';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FiCheckCircle className="text-green-500" />;
      case 'running':
        return <FiPlay className="text-blue-500 animate-spin" />;
      case 'error':
        return <FiXCircle className="text-red-500" />;
      case 'warning':
        return <FiAlertTriangle className="text-yellow-500" />;
      default:
        return <FiClock className="text-gray-400" />;
    }
  };

  const getStepDetails = (step) => {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-medium text-gray-900">{step.name}</h3>
          <button
            onClick={() => setSelectedStep(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-500">Agent</h4>
            <p className="text-sm text-gray-900">{step.agent}</p>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500">Status</h4>
            <div className="flex items-center mt-1">
              <div className={`w-3 h-3 rounded-full mr-2 ${getStatusColor(step.status)}`}></div>
              <span className="text-sm capitalize">{step.status}</span>
            </div>
          </div>

          {step.duration && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">Duration</h4>
              <p className="text-sm text-gray-900">{(step.duration / 1000).toFixed(2)}s</p>
            </div>
          )}

          {step.startedAt && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">Started At</h4>
              <p className="text-sm text-gray-900">{new Date(step.startedAt).toLocaleString()}</p>
            </div>
          )}

          {step.completedAt && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">Completed At</h4>
              <p className="text-sm text-gray-900">{new Date(step.completedAt).toLocaleString()}</p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-gray-500">Input</h4>
            <div className="mt-1 p-3 bg-gray-50 rounded text-sm text-gray-700 max-h-32 overflow-y-auto">
              {step.input}
            </div>
          </div>

          {step.output && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">Output</h4>
              <div className="mt-1 p-3 bg-gray-50 rounded text-sm text-gray-700 max-h-32 overflow-y-auto">
                {step.output}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium text-gray-500">Metadata</h4>
            <div className="mt-1 text-sm text-gray-700">
              <p>Tokens: {step.metadata.tokens}</p>
              <p>Model: {step.metadata.model}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Execution Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Execution Flow</h2>
          <p className="text-sm text-gray-500">Execution ID: {data.id}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <span className="text-sm text-gray-600 mr-2">Speed:</span>
            <select
              value={executionSpeed}
              onChange={(e) => setExecutionSpeed(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={0.5}>0.5x</option>
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={5}>5x</option>
            </select>
          </div>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-full ${isPlaying ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
          >
            {isPlaying ? <FiPause /> : <FiPlay />}
          </button>
          <button className="p-2 rounded-full bg-blue-100 text-blue-600">
            <FiRefreshCw />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>
            {data.completedSteps} of {data.totalSteps} steps completed
          </span>
          <span>{Math.round((data.completedSteps / data.totalSteps) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(data.completedSteps / data.totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Flow Visualization */}
      <div className="relative">
        {/* Vertical timeline */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        <div className="space-y-4 ml-8">
          {data.steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Timeline dot */}
              <div
                className={`absolute -left-8 top-4 w-4 h-4 rounded-full border-4 border-white ${getStatusColor(step.status)}`}
              ></div>

              {/* Step card */}
              <div
                className={`p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                  selectedStep?.id === step.id
                    ? 'bg-indigo-50 border-2 border-indigo-200 shadow-md'
                    : 'bg-white border border-gray-200 hover:shadow-md'
                }`}
                onClick={() => setSelectedStep(step)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="mr-3">{getStatusIcon(step.status)}</div>
                      <h3 className="font-medium text-gray-900">{step.name}</h3>
                      <span className="ml-2 text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                        {step.agent}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 truncate">{step.input}</p>
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      {step.duration && (
                        <span className="mr-3">⏱️ {(step.duration / 1000).toFixed(2)}s</span>
                      )}
                      <span>📊 {step.metadata.tokens} tokens</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        step.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : step.status === 'running'
                            ? 'bg-blue-100 text-blue-800 animate-pulse'
                            : step.status === 'error'
                              ? 'bg-red-100 text-red-800'
                              : step.status === 'warning'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {step.status}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Step Details Modal */}
      {selectedStep && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          {getStepDetails(selectedStep)}
        </div>
      )}

      {/* Execution Controls */}
      <div className="mt-8 flex justify-center space-x-4">
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
          Pause Execution
        </button>
        <button className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700">
          Resume Execution
        </button>
        <button className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700">
          Cancel Execution
        </button>
      </div>
    </div>
  );
};

export default ExecutionFlow;
