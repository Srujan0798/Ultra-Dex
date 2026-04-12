import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import ConfigEditor from '../components/ConfigEditor';

const ConfigPage = () => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('providers');
  const [testResults, setTestResults] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Simulate loading configuration
    setTimeout(() => {
      setConfig({
        providers: {
          openai: {
            enabled: true,
            apiKey: 'sk-...xxx',
            defaultModel: 'gpt-4o-2024-11-20',
            temperature: 0.7,
            maxTokens: 4096,
          },
          anthropic: {
            enabled: true,
            apiKey: 'sk-ant-...yyy',
            defaultModel: 'claude-3-5-sonnet-latest',
            temperature: 0.5,
            maxTokens: 4096,
          },
          google: {
            enabled: true,
            apiKey: '...zzz',
            defaultModel: 'gemini-2.0-flash-exp',
            temperature: 0.7,
            maxTokens: 2048,
          },
          ollama: {
            enabled: false,
            baseUrl: 'http://localhost:11434/v1',
            defaultModel: 'llama3.2',
            temperature: 0.7,
            maxTokens: 2048,
          },
        },
        memory: {
          hotRetention: 3600,
          warmRetention: 86400,
          coldRetention: 2592000,
          maxEntries: 10000,
        },
        agents: {
          defaultConcurrency: 4,
          maxRetries: 3,
          timeout: 30000,
        },
        security: {
          enableSandbox: true,
          restrictFsAccess: true,
          blockNetwork: false,
          auditLogging: true,
        },
      });
      setLoading(false);
    }, 1000);
  }, []);

  const saveConfig = async () => {
    setSaving(true);
    // Simulate saving
    setTimeout(() => {
      setSaving(false);
      alert('Configuration saved successfully!');
    }, 1000);
  };

  const testConnection = async (provider) => {
    setTestResults((prev) => ({
      ...prev,
      [provider]: { status: 'testing', message: 'Testing...' },
    }));

    // Simulate API call
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% success rate for demo
      setTestResults((prev) => ({
        ...prev,
        [provider]: {
          status: success ? 'success' : 'error',
          message: success ? 'Connection successful!' : 'Failed to connect. Check your API key.',
        },
      }));
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Configuration - Ultra-Dex Dashboard</title>
        <meta name="description" content="Configure Ultra-Dex settings" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configuration</h1>
          <p className="mt-2 text-gray-600">
            Manage Ultra-Dex settings and environment configurations
          </p>
        </div>

        <ConfigEditor
          config={config}
          onConfigChange={setConfig}
          testConnection={testConnection}
          testResults={testResults}
          saving={saving}
          onSave={saveConfig}
        />
      </div>
    </div>
  );
};

export default ConfigPage;
