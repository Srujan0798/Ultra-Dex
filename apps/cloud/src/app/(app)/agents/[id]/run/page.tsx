'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/hooks/useToast';
import { Play, Zap, Copy, Check, Terminal, Clock, Coins } from 'lucide-react';

const PROVIDERS = [
  { id: 'claude', name: 'Claude', models: ['claude-3-opus', 'claude-3-sonnet'] },
  { id: 'openai', name: 'OpenAI', models: ['gpt-4', 'gpt-4-turbo'] },
  { id: 'gemini', name: 'Gemini', models: ['gemini-pro', 'gemini-ultra'] },
  { id: 'nvidia', name: 'NVIDIA', models: ['nemotron-4', 'llama-3'] },
];

export default function AgentRun() {
  const params = useParams();
  const agentId = params.id as string;
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState('claude');
  const [model, setModel] = useState('claude-3-opus');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2000);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleRun = async () => {
    if (!prompt.trim()) {
      toast('Please enter a prompt', 'warning');
      return;
    }

    setIsRunning(true);
    setResult(null);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setResult(`# Analysis Complete

## Task Summary
Successfully analyzed the request and generated implementation plan.

## Key Findings
1. Architecture pattern identified: Microservices
2. Recommended tech stack: Node.js + TypeScript
3. Estimated complexity: Medium

## Next Steps
- [ ] Review architecture diagram
- [ ] Implement core components
- [ ] Add unit tests

## Code Example
\`\`\`typescript
// Generated implementation
export class WorkflowEngine {
  async execute(task: Task): Promise<Result> {
    // Implementation here
  }
}
\`\`\`

**Execution time:** 1.8s | **Tokens:** 1,240 | **Cost:** $0.024`);

    setIsRunning(false);
    toast('Execution completed', 'success');
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast('Copied to clipboard', 'success');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeInUp">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] capitalize">
            {agentId} Agent
          </h1>
          <p className="text-[var(--text-muted)]">Execute agent with custom parameters</p>
        </div>
        <Badge variant={isRunning ? 'warning' : result ? 'success' : 'default'}>
          {isRunning ? 'Running' : result ? 'Complete' : 'Ready'}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card elevated>
            <div className="space-y-6">
              {/* Prompt Input */}
              <div>
                <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
                  Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the task you want the agent to perform..."
                  className="w-full h-40 p-4 bg-[var(--primary-700)]/30 border border-[var(--secondary-500)]/30 rounded-[var(--radius-sm)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] font-[var(--font-code)] text-sm focus:outline-none focus:border-[var(--accent-primary)]/60 focus:shadow-glow-accent transition-all duration-200 resize-none"
                />
              </div>

              {/* Provider & Model */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
                    Provider
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => {
                      setProvider(e.target.value);
                      const p = PROVIDERS.find((p) => p.id === e.target.value);
                      if (p) setModel(p.models[0]);
                    }}
                    className="w-full h-[var(--input-height)] px-4 py-2.5 bg-[var(--primary-700)]/30 border border-[var(--secondary-500)]/30 rounded-[var(--radius-sm)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]/60 transition-all"
                  >
                    {PROVIDERS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
                    Model
                  </label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full h-[var(--input-height)] px-4 py-2.5 bg-[var(--primary-700)]/30 border border-[var(--secondary-500)]/30 rounded-[var(--radius-sm)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]/60 transition-all"
                  >
                    {PROVIDERS.find((p) => p.id === provider)?.models.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Advanced Options */}
              <div className="border border-[var(--secondary-500)]/20 rounded-[var(--radius-sm)] p-4">
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
                  Advanced Options
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-1">
                      Temperature
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-xs text-[var(--text-muted)]">{temperature}</span>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] block mb-1">
                      Max Tokens
                    </label>
                    <input
                      type="number"
                      value={maxTokens}
                      onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                      className="w-full h-8 px-2 bg-[var(--primary-700)]/30 border border-[var(--secondary-500)]/30 rounded text-[var(--text-primary)] text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Run Button */}
              <Button
                onClick={handleRun}
                isLoading={isRunning}
                size="lg"
                className="w-full"
                icon={<Zap className="w-5 h-5" />}
              >
                {isRunning ? 'Executing...' : 'Run Agent'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Info Panel */}
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-[var(--accent-primary)]" />
              Execution Info
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Status</span>
                <Badge variant={isRunning ? 'warning' : result ? 'success' : 'default'}>
                  {isRunning ? 'Running' : result ? 'Complete' : 'Ready'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Cost</span>
                <span className="text-[var(--text-primary)]">${result ? '0.024' : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Duration</span>
                <span className="text-[var(--text-primary)]">{result ? '1.8s' : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Tokens</span>
                <span className="text-[var(--text-primary)]">{result ? '1,240' : '—'}</span>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Coins className="w-4 h-4 text-[var(--accent-secondary)]" />
              Provider Info
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Provider</span>
                <span className="text-[var(--text-primary)]">
                  {PROVIDERS.find((p) => p.id === provider)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Model</span>
                <span className="text-[var(--text-primary)]">{model}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Results Panel */}
      {result && (
        <Card elevated className="animate-fadeInUp [animation-delay:80ms]">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Terminal className="w-5 h-5 text-[var(--accent-primary)]" />
                Result
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyToClipboard}
                  icon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setResult(null)}>
                  Clear
                </Button>
              </div>
            </div>
            <div className="bg-[var(--primary-900)]/50 border border-[var(--secondary-500)]/20 rounded-[var(--radius-sm)] p-4 overflow-x-auto">
              <pre className="text-[var(--text-primary)] text-sm font-[var(--font-code)] whitespace-pre-wrap">
                {result}
              </pre>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
