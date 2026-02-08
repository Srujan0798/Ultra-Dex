import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Chart } from '../components/Chart';

const memoryData = [
  { tier: 'Hot', tokens: 2048, max: 4096 },
  { tier: 'Warm', tokens: 6000, max: 8192 },
  { tier: 'Cold', tokens: 45000, max: 100000 },
];

export function Memory() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Memory Tiers</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {memoryData.map(({ tier, tokens, max }) => (
          <div key={tier} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold">{tier} Tier</h3>
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-400">
                <span>{tokens.toLocaleString()} tokens</span>
                <span>{Math.round((tokens / max) * 100)}%</span>
              </div>
              <div className="mt-2 h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all"
                  style={{ width: `${(tokens / max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Chart title="Token Distribution" subtitle="Across hot / warm / cold tiers">
        <BarChart data={memoryData}>
          <XAxis dataKey="tier" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip />
          <Bar dataKey="tokens" fill="#8b5cf6" />
        </BarChart>
      </Chart>
    </div>
  );
}
