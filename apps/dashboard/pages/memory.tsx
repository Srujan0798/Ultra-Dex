import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import io from 'socket.io-client';
import MemoryGraph from '../components/MemoryGraph';

const MemoryPage = () => {
  const [socket, setSocket] = useState(null);
  const [memoryData, setMemoryData] = useState({
    hot: 0,
    warm: 0,
    cold: 0,
    entries: [],
    searchQuery: ''
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000');

    newSocket.on('connect', () => {
      console.log('Connected to memory endpoint');
    });

    newSocket.on('memory-update', (data) => {
      setMemoryData(prev => ({
        ...prev,
        hot: data.hot || prev.hot,
        warm: data.warm || prev.warm,
        cold: data.cold || prev.cold,
        entries: data.entries || prev.entries
      }));
      setLoading(false);
    });

    // Simulate initial data if socket doesn't connect quickly
    const timer = setTimeout(() => {
      if (memoryData.entries.length === 0) {
        setMemoryData({
          ...memoryData,
          hot: 45,
          warm: 23,
          cold: 12,
          entries: [
            { id: '1', content: 'User authentication flow', type: 'decision', timestamp: '2026-02-13T10:30:00Z', importance: 8 },
            { id: '2', content: 'Database schema for users table', type: 'constraint', timestamp: '2026-02-13T09:15:00Z', importance: 9 },
            { id: '3', content: 'API endpoint for user registration', type: 'observation', timestamp: '2026-02-13T08:45:00Z', importance: 6 },
            { id: '4', content: 'Security considerations for JWT tokens', type: 'decision', timestamp: '2026-02-13T07:20:00Z', importance: 10 },
            { id: '5', content: 'Frontend component structure', type: 'observation', timestamp: '2026-02-13T06:10:00Z', importance: 5 },
          ]
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

  const filteredEntries = memoryData.entries.filter(entry => 
    entry.content.toLowerCase().includes(memoryData.searchQuery.toLowerCase())
  );

  const getImportanceColor = (importance) => {
    if (importance >= 8) return 'bg-red-100 text-red-800';
    if (importance >= 6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'decision': return 'bg-blue-100 text-blue-800';
      case 'constraint': return 'bg-purple-100 text-purple-800';
      case 'observation': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Memory - Ultra-Dex Dashboard</title>
        <meta name="description" content="Manage Ultra-Dex memory system" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Memory System</h1>
          <p className="mt-2 text-gray-600">Tiered memory management and retrieval</p>
        </div>

        {/* Memory Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Hot Memory</h3>
            <p className="mt-2 text-3xl font-semibold text-indigo-600">{memoryData.hot}</p>
            <p className="text-sm text-gray-500 mt-1">Frequently accessed</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Warm Memory</h3>
            <p className="mt-2 text-3xl font-semibold text-indigo-600">{memoryData.warm}</p>
            <p className="text-sm text-gray-500 mt-1">Moderately accessed</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Cold Memory</h3>
            <p className="mt-2 text-3xl font-semibold text-indigo-600">{memoryData.cold}</p>
            <p className="text-sm text-gray-500 mt-1">Rarely accessed</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('browse')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'browse'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Browse Entries
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'search'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Search
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Memory Distribution</h2>
              <MemoryGraph memory={{ hot: memoryData.hot, warm: memoryData.warm, cold: memoryData.cold }} />
            </div>
            <div className="bg-white rounded-xl shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Memory Insights</h2>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900">Hot Memory Trend</h3>
                  <p className="mt-1 text-sm text-blue-700">Hot memory usage has increased by 15% this week, indicating more frequent access patterns.</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-medium text-green-900">Efficiency Score</h3>
                  <p className="mt-1 text-sm text-green-700">Memory retrieval efficiency is at 94%, suggesting optimal tiering strategy.</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-medium text-yellow-900">Cold Storage</h3>
                  <p className="mt-1 text-sm text-yellow-700">Consider archiving {Math.floor(memoryData.cold * 0.3)} entries to reduce memory footprint.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'browse' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900">Memory Entries</h2>
                <div className="text-sm text-gray-500">
                  Showing {filteredEntries.length} of {memoryData.entries.length} entries
                </div>
              </div>
              
              {loading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading memory entries...</p>
                </div>
              ) : (
                <div className="overflow-hidden">
                  <ul className="divide-y divide-gray-200">
                    {filteredEntries.map((entry) => (
                      <li key={entry.id} className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{entry.content}</p>
                            <div className="mt-1 flex items-center text-sm text-gray-500">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(entry.type)}`}>
                                {entry.type}
                              </span>
                              <span className="mx-2">•</span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImportanceColor(entry.importance)}`}>
                                Importance: {entry.importance}
                              </span>
                              <span className="mx-2">•</span>
                              <span>{new Date(entry.timestamp).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="flex space-x-3">
                            <button className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
                              View
                            </button>
                            <button className="px-3 py-1 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50">
                              Promote
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              <div className="mb-6">
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search Memory
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="search"
                    placeholder="Search memory entries..."
                    value={memoryData.searchQuery}
                    onChange={(e) => setMemoryData({...memoryData, searchQuery: e.target.value})}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden">
                <ul className="divide-y divide-gray-200">
                  {filteredEntries.map((entry) => (
                    <li key={entry.id} className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{entry.content}</p>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(entry.type)}`}>
                              {entry.type}
                            </span>
                            <span className="mx-2">•</span>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImportanceColor(entry.importance)}`}>
                              {entry.importance}/10
                            </span>
                            <span className="mx-2">•</span>
                            <span>{new Date(entry.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="flex space-x-3">
                          <button className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
                            View
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {filteredEntries.length === 0 && memoryData.searchQuery && (
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    No memory entries match "{memoryData.searchQuery}". Try different keywords.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryPage;