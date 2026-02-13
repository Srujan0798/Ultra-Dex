import React, { useState, useEffect } from 'react';
import { FiSave, FiRefreshCw, FiEye, FiCode, FiDatabase, FiShield, FiCloud, FiZap, FiGlobe, FiKey, FiSettings, FiCheck, FiX, FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';

const ConfigEditor = () => {
  const [config, setConfig] = useState({
    providers: {
      openai: {
        enabled: true,
        apiKey: '',
        defaultModel: 'gpt-4o-2024-11-20',
        temperature: 0.7,
        maxTokens: 4096
      },
      anthropic: {
        enabled: true,
        apiKey: '',
        defaultModel: 'claude-3-5-sonnet-latest',
        temperature: 0.5,
        maxTokens: 4096
      },
      google: {
        enabled: true,
        apiKey: '',
        defaultModel: 'gemini-2.0-flash-exp',
        temperature: 0.7,
        maxTokens: 2048
      },
      ollama: {
        enabled: false,
        baseUrl: 'http://localhost:11434/v1',
        defaultModel: 'llama3.2',
        temperature: 0.7,
        maxTokens: 2048
      }
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

  const [activeTab, setActiveTab] = useState('providers');
  const [editingField, setEditingField] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [testResults, setTestResults] = useState({});
  const [saving, setSaving] = useState(false);

  const handleFieldChange = (section, field, value) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleProviderChange = (provider, field, value) => {
    setConfig(prev => ({
      ...prev,
      providers: {
        ...prev.providers,
        [provider]: {
          ...prev.providers[provider],
          [field]: value
        }
      }
    }));
  };

  const startEditing = (fieldPath, currentValue) => {
    setEditingField(fieldPath);
    setEditingValue(currentValue);
  };

  const saveEditing = () => {
    if (!editingField) return;

    const [section, subsection, field] = editingField.split('.');
    if (section === 'providers') {
      handleProviderChange(subsection, field, editingValue);
    } else {
      handleFieldChange(section, field, editingValue);
    }

    setEditingField(null);
    setEditingValue('');
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditingValue('');
  };

  const testConnection = async (provider) => {
    setTestResults(prev => ({ ...prev, [provider]: { status: 'testing', message: 'Testing...' } }));
    
    // Simulate API call
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% success rate for demo
      setTestResults(prev => ({
        ...prev,
        [provider]: {
          status: success ? 'success' : 'error',
          message: success ? 'Connection successful!' : 'Failed to connect. Check your API key.'
        }
      }));
    }, 1500);
  };

  const saveConfig = async () => {
    setSaving(true);
    // Simulate saving
    setTimeout(() => {
      setSaving(false);
      alert('Configuration saved successfully!');
    }, 1000);
  };

  const renderEditableField = (fieldPath, value, label) => {
    if (editingField === fieldPath) {
      return (
        <div className="flex items-center">
          <input
            type="text"
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm"
            autoFocus
          />
          <button
            onClick={saveEditing}
            className="ml-2 p-1 text-green-600 hover:bg-green-100 rounded"
          >
            <FiCheck />
          </button>
          <button
            onClick={cancelEditing}
            className="ml-1 p-1 text-red-600 hover:bg-red-100 rounded"
          >
            <FiX />
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-900">{value}</span>
        <button
          onClick={() => startEditing(fieldPath, value)}
          className="ml-2 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
        >
          <FiEdit2 />
        </button>
      </div>
    );
  };

  const renderToggle = (fieldPath, value, label) => {
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-900">{label}</span>
        <button
          onClick={() => {
            const [section, subsection, field] = fieldPath.split('.');
            if (section === 'providers') {
              handleProviderChange(subsection, field, !value);
            } else {
              handleFieldChange(section, field, !value);
            }
          }}
          className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
            value ? 'bg-indigo-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
              value ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    );
  };

  const renderProviderSection = () => {
    return (
      <div className="space-y-6">
        {Object.entries(config.providers).map(([provider, settings]) => (
          <div key={provider} className="border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 capitalize flex items-center">
                {provider === 'openai' && <FiGlobe className="mr-2" />}
                {provider === 'anthropic' && <FiSettings className="mr-2" />}
                {provider === 'google' && <FiKey className="mr-2" />}
                {provider === 'ollama' && <FiZap className="mr-2" />}
                {provider}
              </h3>
              {renderToggle(`providers.${provider}.enabled`, settings.enabled, 'Enabled')}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {settings.enabled && (
                <>
                  {provider !== 'ollama' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                      {renderEditableField(`providers.${provider}.apiKey`, settings.apiKey.replace(/./g, '*'), settings.apiKey)}
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                      {renderEditableField(`providers.${provider}.baseUrl`, settings.baseUrl, settings.baseUrl)}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Model</label>
                    {renderEditableField(`providers.${provider}.defaultModel`, settings.defaultModel, settings.defaultModel)}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
                    {renderEditableField(`providers.${provider}.temperature`, settings.temperature, settings.temperature)}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Tokens</label>
                    {renderEditableField(`providers.${provider}.maxTokens`, settings.maxTokens, settings.maxTokens)}
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => testConnection(provider)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center"
              >
                <FiRefreshCw className="mr-2" />
                Test Connection
              </button>
              {testResults[provider] && (
                <div className={`ml-4 px-3 py-2 rounded-md text-sm ${
                  testResults[provider].status === 'success' 
                    ? 'bg-green-100 text-green-800' 
                    : testResults[provider].status === 'error'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {testResults[provider].message}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMemorySection = () => {
    return (
      <div className="space-y-6">
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FiDatabase className="mr-2" />
            Memory Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hot Retention (seconds)</label>
              {renderEditableField('memory.hotRetention', config.memory.hotRetention, config.memory.hotRetention)}
              <p className="mt-1 text-xs text-gray-500">How long hot memory is retained</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warm Retention (seconds)</label>
              {renderEditableField('memory.warmRetention', config.memory.warmRetention, config.memory.warmRetention)}
              <p className="mt-1 text-xs text-gray-500">How long warm memory is retained</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cold Retention (seconds)</label>
              {renderEditableField('memory.coldRetention', config.memory.coldRetention, config.memory.coldRetention)}
              <p className="mt-1 text-xs text-gray-500">How long cold memory is retained</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Entries</label>
              {renderEditableField('memory.maxEntries', config.memory.maxEntries, config.memory.maxEntries)}
              <p className="mt-1 text-xs text-gray-500">Maximum number of entries in memory</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAgentsSection = () => {
    return (
      <div className="space-y-6">
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FiZap className="mr-2" />
            Agent Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Concurrency</label>
              {renderEditableField('agents.defaultConcurrency', config.agents.defaultConcurrency, config.agents.defaultConcurrency)}
              <p className="mt-1 text-xs text-gray-500">Number of agents that can run concurrently</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Retries</label>
              {renderEditableField('agents.maxRetries', config.agents.maxRetries, config.agents.maxRetries)}
              <p className="mt-1 text-xs text-gray-500">Maximum number of retries for failed tasks</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timeout (ms)</label>
              {renderEditableField('agents.timeout', config.agents.timeout, config.agents.timeout)}
              <p className="mt-1 text-xs text-gray-500">Timeout for agent operations</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSecuritySection = () => {
    return (
      <div className="space-y-6">
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <FiShield className="mr-2" />
            Security Settings
          </h3>
          
          <div className="space-y-4">
            {Object.entries(config.security).map(([setting, value]) => (
              <div key={setting} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {setting.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                {renderToggle(`security.${setting}`, value, setting)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'providers', name: 'AI Providers', icon: FiGlobe },
            { id: 'memory', name: 'Memory', icon: FiDatabase },
            { id: 'agents', name: 'Agents', icon: FiZap },
            { id: 'security', name: 'Security', icon: FiShield }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="mr-2 h-4 w-4" />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      <div className="mb-6">
        {activeTab === 'providers' && renderProviderSection()}
        {activeTab === 'memory' && renderMemorySection()}
        {activeTab === 'agents' && renderAgentsSection()}
        {activeTab === 'security' && renderSecuritySection()}
      </div>

      <div className="flex justify-end">
        <button
          onClick={saveConfig}
          disabled={saving}
          className={`px-6 py-3 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 flex items-center ${
            saving ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {saving ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <FiSave className="mr-2" />
              Save Configuration
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ConfigEditor;