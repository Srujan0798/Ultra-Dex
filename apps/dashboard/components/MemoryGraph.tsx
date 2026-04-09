import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const MemoryGraph = ({ memory = { hot: 0, warm: 0, cold: 0 } }) => {
  const data = [
    { name: 'Hot Memory', value: memory.hot || 0, color: '#4f46e5' },
    { name: 'Warm Memory', value: memory.warm || 0, color: '#60a5fa' },
    { name: 'Cold Memory', value: memory.cold || 0, color: '#94a3b8' },
  ];

  // Calculate total for percentage
  const total = data.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              formatter={(value) => [value, 'Entries']}
              labelFormatter={(label) => `Memory Tier: ${label}`}
            />
            <Bar dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        {data.map((tier, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: tier.color }}
              ></div>
              <h3 className="text-sm font-medium text-gray-900">{tier.name}</h3>
            </div>
            <p className="mt-1 text-2xl font-semibold text-gray-900">{tier.value}</p>
            <p className="text-sm text-gray-500">
              {total > 0 ? `${Math.round((tier.value / total) * 100)}%` : '0%'} of total
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MemoryGraph;
