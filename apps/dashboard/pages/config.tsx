import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import io from 'socket.io-client';
import ConfigEditor from '../components/ConfigEditor';

const ConfigPage = () => {
  const [socket, setSocket] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [environment, setEnvironment] = useState('development');
  const [environments, setEnvironments] = useState([
    { name: 'development', active: true },
    { name: 'staging', active: false },
    { name: 'production', active: false }
  ]);

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000');

    newSocket.on('connect', () => {
      console.log('Connected to config endpoint');
    });

    newSocket.on('config-update', (data) => {
      setConfig(data);
      setLoading(false);
    });

    // Simulate initial data if socket doesn't connect quickly
    const timer = setTimeout(() => {
      if (!config) {
        setConfig({
          version: '6.0.0',
          providers: {
            openai: { enabled: true, apiKey: 'sk-...xxx', defaultModel: 'gpt-4o-2024-11-20' },
            anthropic: { enabled: true, apiKey: 'sk-ant-...yyy', defaultModel: 'claude-3-5-sonnet-latest' },
            google: { enabled: true, apiKey: '...zzz', defaultModel: 'gemini-2.0-flash-exp' },
            ollama: { enabled: false, baseUrl: 'http://localhost:11434', defaultModel: 'llama3.2' }
          },
          memory: {
            hotRetention: 3600,
            warmRetention: 86400,
            coldRetention: 2592000,
            maxEntries: 10000
          },
          agents: {
            defaultConcurrency: 4,
            maxRetries: 3,
            timeout: 30000
          },
          security: {
            enableSandbox: true,
            restrictFsAccess: true,
            blockNetwork: false,
            auditLogging: true
          }
        });
        setLoading(false);
      }
    }, 2000);

    setSocket(newSocket);

    return () => {
      clearTimeout(timer);
      newSocket.close();
    };
  }, []);

  const switchEnvironment = (envName) => {
    setEnvironment(envName);
    setEnvironments(environments.map(env => ({
      ...env,
      active: env.name === envName
    })));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Configuration - Ultra-Dex Dashboard</title>
        <meta name="description" content="Configure Ultra-Dex settings" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configuration</h1>
          <p className="mt-2 text-gray-600">Manage Ultra-Dex settings and environment configurations</p>
        </div>

        {/* Environment Selector */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Environment</h2>
          <div className="flex space-x-4">
            {environments.map((env) => (
              <button
                key={env.name}
                onClick={() => switchEnvironment(env.name)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  env.active
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {env.name.charAt(0).toUpperCase() + env.name.slice(1)}
                {env.active && (
                  <span className="ml-2 bg-indigo-800 text-xs px-2 py-0.5 rounded-full">
                    Active
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Config Editor */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading configuration...</p>
            </div>
          ) : (
            <ConfigEditor />
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Export Config</h3>
            <p className="text-sm text-gray-500 mb-4">Download your current configuration</p>
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50">
              Export
            </button>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Import Config</h3>
            <p className="text-sm text-gray-500 mb-4">Upload a configuration file</p>
            <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50">
              Import
            </button>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Reset to Defaults</h3>
            <p className="text-sm text-gray-500 mb-4">Restore factory settings</p>
            <button className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700">
              Reset
            </button>
          </div>
        </div>

        {/* Configuration Status */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Configuration Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-2">Provider Status</h3>
              <div className="space-y-2">
                {config && Object.entries(config.providers).map(([provider, settings]) => (
                  <div key={provider} className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${settings.enabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm text-gray-700 capitalize">{provider}</span>
                    <span className="ml-auto text-sm text-gray-500">
                      {settings.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-md font-medium text-gray-900 mb-2">Security Status</h3>
              <div className="space-y-2">
                {config && Object.entries(config.security).map(([setting, value]) => (
                  <div key={setting} className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${value ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm text-gray-700 capitalize">
                      {setting.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="ml-auto text-sm text-gray-500">
                      {value ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigPage;