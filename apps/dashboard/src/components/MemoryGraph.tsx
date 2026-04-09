import { memo, useMemo, useState } from 'react';
import type { MemoryMetrics } from '../lib/websocket';

interface MemoryNode {
  id: string;
  label: string;
  tier: 'hot' | 'warm' | 'cold';
  timestamp: string;
}

interface MemoryGraphProps {
  memory: MemoryMetrics;
  nodes?: MemoryNode[];
}

const tierColor: Record<MemoryNode['tier'], string> = {
  hot: '#ef4444',
  warm: '#f59e0b',
  cold: '#3b82f6',
};

function generateNodes(memory: MemoryMetrics): MemoryNode[] {
  const now = Date.now();
  const build = (tier: MemoryNode['tier'], count: number) =>
    Array.from({ length: Math.min(10, Math.max(1, count || 1)) }, (_, index) => ({
      id: `${tier}-${index}`,
      label: `${tier.toUpperCase()}-${index + 1}`,
      tier,
      timestamp: new Date(now - (index + 1) * 60 * 60 * 1_000).toISOString(),
    }));

  return [
    ...build('hot', memory.hot),
    ...build('warm', memory.warm),
    ...build('cold', memory.cold),
  ];
}

export const MemoryGraph = memo(function MemoryGraph({ memory, nodes }: MemoryGraphProps) {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');
  const [timelineHours, setTimelineHours] = useState(24);

  const baseNodes = useMemo(
    () => (nodes && nodes.length > 0 ? nodes : generateNodes(memory)),
    [nodes, memory]
  );

  const filteredNodes = useMemo(() => {
    const cutoff = Date.now() - timelineHours * 60 * 60 * 1_000;

    return baseNodes.filter((node) => {
      const tierMatch = tierFilter === 'all' || node.tier === tierFilter;
      const searchMatch =
        search.trim().length === 0 || node.label.toLowerCase().includes(search.toLowerCase());
      const timeMatch = Date.parse(node.timestamp) >= cutoff;
      return tierMatch && searchMatch && timeMatch;
    });
  }, [baseNodes, tierFilter, search, timelineHours]);

  const positionedNodes = useMemo(() => {
    return filteredNodes.map((node, index) => {
      const angle = (index / Math.max(1, filteredNodes.length)) * Math.PI * 2;
      const radius = 120 + (index % 5) * 14;
      return {
        ...node,
        x: 170 + Math.cos(angle) * radius,
        y: 170 + Math.sin(angle) * radius,
      };
    });
  }, [filteredNodes]);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Memory Relationship Graph</h3>
          <p className="text-xs text-slate-400">
            Filter by tier, search nodes, and inspect timeline slices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-200"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search memory node"
            value={search}
          />

          <select
            className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-300"
            onChange={(event) =>
              setTierFilter(event.target.value as 'all' | 'hot' | 'warm' | 'cold')
            }
            value={tierFilter}
          >
            <option value="all">All tiers</option>
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
          </select>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <svg className="h-[340px] w-full" viewBox="0 0 340 340">
            {positionedNodes.map((node, index) => {
              const nextNode = positionedNodes[(index + 1) % positionedNodes.length];
              if (!nextNode) {
                return null;
              }
              return (
                <line
                  key={`edge:${node.id}:${nextNode.id}`}
                  stroke="#1f2937"
                  strokeWidth="1"
                  x1={node.x}
                  x2={nextNode.x}
                  y1={node.y}
                  y2={nextNode.y}
                />
              );
            })}

            {positionedNodes.map((node) => (
              <g key={node.id}>
                <circle cx={node.x} cy={node.y} fill={tierColor[node.tier]} r="7" />
                <title>{`${node.label} (${node.tier})`}</title>
              </g>
            ))}
          </svg>
        </div>

        <aside className="space-y-4 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div>
            <label className="text-xs text-slate-400" htmlFor="timeline-hours">
              Timeline window: last {timelineHours}h
            </label>
            <input
              className="mt-2 w-full"
              id="timeline-hours"
              max={168}
              min={1}
              onChange={(event) => setTimelineHours(Number(event.target.value))}
              type="range"
              value={timelineHours}
            />
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <span>Total nodes</span>
              <span>{positionedNodes.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Hot tier</span>
              <span>{positionedNodes.filter((node) => node.tier === 'hot').length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Warm tier</span>
              <span>{positionedNodes.filter((node) => node.tier === 'warm').length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Cold tier</span>
              <span>{positionedNodes.filter((node) => node.tier === 'cold').length}</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
});
