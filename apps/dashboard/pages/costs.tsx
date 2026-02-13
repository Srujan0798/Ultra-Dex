import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import io from 'socket.io-client';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const CostsPage = () => {
  const [socket, setSocket] = useState(null);
  const [costData, setCostData] = useState({
    daily: [],
    monthly: [],
    providers: [],
    totals: { today: 0, month: 0, forecast: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000');

    newSocket.on('connect', () => {
      console.log('Connected to costs endpoint');
    });

    newSocket.on('cost-update', (data) => {
      setCostData(data);
      setLoading(false);
    });

    // Simulate initial data if socket doesn't connect quickly
    const timer = setTimeout(() => {
      if (costData.daily.length === 0) {
        setCostData({
          daily: [
            { date: '2026-02-01', cost: 12.45, tokens: 124500 },
            { date: '2026-02-02', cost: 15.67, tokens: 156700 },
            { date: '2026-02-03', cost: 18.23, tokens: 182300 },
            { date: '2026-02-04', cost: 14.89, tokens: 148900 },
            { date: '2026-02-05', cost: 22.34, tokens: 223400 },
            { date: '2026-02-06', cost: 19.78, tokens: 197800 },
            { date: '2026-02-07', cost: 16.54, tokens: 165400 },
            { date: '2026-02-08', cost: 21.90, tokens: 219000 },
            { date: '2026-02-09', cost: 25.33, tokens: 253300 },
            { date: '2026-02-10', cost: 17.65, tokens: 176500 },
            { date: '2026-02-11', cost: 14.22, tokens: 142200 },
            { date: '2026-02-12', cost: 18.76, tokens: 187600 },
            { date: '2026-02-13', cost: 11.45, tokens: 114500 }, // Today
          ],
          monthly: [
            { month: 'Jan 2026', cost: 420.67, tokens: 4206700 },
            { month: 'Feb 2026', cost: 235.89, tokens: 2358900 }, // Partial month
          ],
          providers: [
            { name: 'OpenAI', cost: 125.45, percentage: 53.2 },
            { name: 'Anthropic', cost: 67.23, percentage: 28.5 },
            { name: 'Google', cost: 32.78, percentage: 13.9 },
            { name: 'Ollama', cost: 10.43, percentage: 4.4 },
          ],
          totals: { 
            today: 11.45, 
            month: 235.89, 
            forecast: 487.23 // Projected to end of month
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

  const COLORS = ['#4f46e5', '#60a5fa', '#34d399', '#fbbf24', '#f87171'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>Costs - Ultra-Dex Dashboard</title>
        <meta name="description" content="Track Ultra-Dex usage costs" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Cost Management</h1>
          <p className="mt-2 text-gray-600">Monitor and optimize your AI usage costs</p>
        </div>

        {/* Cost Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Today's Cost</h3>
            <p className="mt-2 text-3xl font-semibold text-indigo-600">${costData.totals.today?.toFixed(2) || '0.00'}</p>
            <p className="text-sm text-gray-500 mt-1">Current billing day</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Month-to-Date</h3>
            <p className="mt-2 text-3xl font-semibold text-indigo-600">${costData.totals.month?.toFixed(2) || '0.00'}</p>
            <p className="text-sm text-gray-500 mt-1">Current billing period</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Forecast</h3>
            <p className="mt-2 text-3xl font-semibold text-indigo-600">${costData.totals.forecast?.toFixed(2) || '0.00'}</p>
            <p className="text-sm text-gray-500 mt-1">Projected monthly cost</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Monthly Budget</h3>
            <p className="mt-2 text-3xl font-semibold text-indigo-600">$500.00</p>
            <p className="text-sm text-gray-500 mt-1">Set in config</p>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {['week', 'month', 'quarter', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  timeRange === range
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Daily Cost Chart */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Daily Costs</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={costData.daily}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Cost']} />
                  <Legend />
                  <Bar dataKey="cost" name="Cost ($)" fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Provider Cost Distribution */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Provider Distribution</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costData.providers}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="cost"
                    nameKey="name"
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                  >
                    {costData.providers.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${value}`, 'Cost']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Monthly Trends</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={costData.monthly}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Cost']} />
                <Legend />
                <Line type="monotone" dataKey="cost" name="Monthly Cost ($)" stroke="#4f46e5" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Controls */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Cost Controls</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Budget Limit
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  type="number"
                  className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  defaultValue="500"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Set a monthly spending limit to prevent unexpected costs
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cost Alert Threshold
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
                <input
                  type="number"
                  className="block w-full pl-7 pr-12 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  defaultValue="80"
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Receive alerts when spending reaches this percentage of your budget
              </p>
            </div>
          </div>
          <div className="mt-6">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostsPage;