import React from 'react';

const providers = [
  // Core (10)
  { name: 'OpenAI', model: 'gpt-4-turbo', tier: 'core', status: 'active' },
  { name: 'Anthropic', model: 'claude-3-sonnet', tier: 'core', status: 'active' },
  { name: 'Google', model: 'gemini-pro', tier: 'core', status: 'active' },
  { name: 'Mistral', model: 'mistral-large', tier: 'core', status: 'active' },
  { name: 'Groq', model: 'llama-3.1-70b', tier: 'core', status: 'active' },
  { name: 'DeepSeek', model: 'deepseek-chat', tier: 'core', status: 'active' },
  { name: 'Cohere', model: 'command-r-plus', tier: 'core', status: 'active' },
  { name: 'Together', model: 'meta-llama/Llama-3', tier: 'core', status: 'active' },
  { name: 'Fireworks', model: 'llama-v3p1-70b', tier: 'core', status: 'active' },
  { name: 'Perplexity', model: 'llama-3.1-sonar', tier: 'core', status: 'active' },
  // New-Gen (6)
  { name: 'Kimi', model: 'moonshot-v1-128k', tier: 'new-gen', status: 'active' },
  { name: 'Qwen', model: 'qwen-turbo', tier: 'new-gen', status: 'active' },
  { name: 'Yi', model: 'yi-large', tier: 'new-gen', status: 'active' },
  { name: 'DeepSeek R1', model: 'deepseek-r1', tier: 'new-gen', status: 'active' },
  { name: 'OpenClaw', model: 'openclaw-7b', tier: 'new-gen', status: 'active' },
  { name: 'ZhipuAI', model: 'glm-4', tier: 'new-gen', status: 'active' },
  // Next-Gen 2026 (5)
  { name: 'GPT-5', model: 'gpt-5', tier: 'next-gen', status: 'ready' },
  { name: 'Claude 4', model: 'claude-4-opus', tier: 'next-gen', status: 'ready' },
  { name: 'Gemini 2.5', model: 'gemini-2.5-pro', tier: 'next-gen', status: 'ready' },
  { name: 'Llama 4', model: 'Llama-4-Maverick', tier: 'next-gen', status: 'ready' },
  { name: 'Grok-3', model: 'grok-3', tier: 'next-gen', status: 'ready' },
];

const tierColors: Record<string, string> = {
  core: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
  'new-gen': 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
  'next-gen': 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30',
};

const tierLabels: Record<string, string> = {
  core: 'Core',
  'new-gen': 'New-Gen',
  'next-gen': '2026 Next-Gen',
};

const statusDot: Record<string, string> = {
  active: 'bg-green-400 shadow-green-400/50',
  ready: 'bg-amber-400 shadow-amber-400/50',
  offline: 'bg-red-400 shadow-red-400/50',
};

export function Providers() {
  const tiers = ['core', 'new-gen', 'next-gen'];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Providers</h1>
        <p className="mt-1 text-sm text-slate-400">
          {providers.length} providers registered · Smart Router active
        </p>
      </div>

      {tiers.map((tier) => (
        <div key={tier}>
          <h2 className="mb-3 text-lg font-semibold text-slate-300">
            {tierLabels[tier]}{' '}
            <span className="text-sm font-normal text-slate-500">
              ({providers.filter((p) => p.tier === tier).length})
            </span>
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {providers
              .filter((p) => p.tier === tier)
              .map((p) => (
                <div
                  key={p.name}
                  className={`rounded-xl border bg-gradient-to-br p-4 backdrop-blur-sm transition-all hover:scale-[1.02] ${tierColors[tier]}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-white">{p.name}</span>
                    <span className={`h-2.5 w-2.5 rounded-full shadow-lg ${statusDot[p.status]}`} />
                  </div>
                  <p className="mt-1 text-xs text-slate-400 font-mono">{p.model}</p>
                  <div className="mt-3 flex gap-2">
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
                      chat
                    </span>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
                      stream
                    </span>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
                      embed
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
