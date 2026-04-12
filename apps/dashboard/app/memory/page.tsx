'use client';

import { useMemo, useState } from 'react';

type Tier = 'L1' | 'L2' | 'L3';

interface MemoryEntry {
  id: string;
  tier: Tier;
  content: string;
  metadata: Record<string, string>;
  embedding: number[];
}

const ENTRIES: MemoryEntry[] = [
  {
    id: 'mem_1',
    tier: 'L1',
    content: 'Current task context for plugin CLI implementation.',
    metadata: { source: 'runtime', relevance: '0.98' },
    embedding: [0.7, 0.4, 0.2, 0.9, 0.3],
  },
  {
    id: 'mem_2',
    tier: 'L2',
    content: 'Persisted team RBAC policy and workspace config.',
    metadata: { source: 'redis', relevance: '0.91' },
    embedding: [0.4, 0.6, 0.8, 0.2, 0.5],
  },
  {
    id: 'mem_3',
    tier: 'L3',
    content: 'Historical audit summaries for compliance reporting.',
    metadata: { source: 'archive', relevance: '0.84' },
    embedding: [0.3, 0.2, 0.7, 0.5, 0.9],
  },
];

function toJsonFile(rows: MemoryEntry[]) {
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'memory-export.json';
  link.click();
  URL.revokeObjectURL(url);
}

export default function MemoryPage() {
  const [entries, setEntries] = useState(ENTRIES);
  const [activeTier, setActiveTier] = useState<Tier>('L1');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(ENTRIES[0].id);
  const [importText, setImportText] = useState('');

  const results = useMemo(() => {
    return entries.filter((entry) => {
      if (entry.tier !== activeTier) return false;
      if (!query.trim()) return true;
      return entry.content.toLowerCase().includes(query.toLowerCase());
    });
  }, [entries, activeTier, query]);

  const selected = results.find((entry) => entry.id === selectedId) ?? results[0] ?? null;

  function clearTier() {
    setEntries((prev) => prev.filter((entry) => entry.tier !== activeTier));
  }

  function importEntries() {
    try {
      const parsed = JSON.parse(importText) as MemoryEntry[];
      if (!Array.isArray(parsed)) return;
      setEntries((prev) => [...prev, ...parsed]);
      setImportText('');
    } catch {
      // Ignore invalid JSON input.
    }
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Memory</h1>

      <input
        className="w-full border rounded px-3 py-2"
        placeholder="Semantic search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="flex gap-2">
        {(['L1', 'L2', 'L3'] as Tier[]).map((tier) => (
          <button
            key={tier}
            className={`border rounded px-3 py-1 ${activeTier === tier ? 'bg-black text-white' : ''}`}
            onClick={() => setActiveTier(tier)}
          >
            {tier}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="border rounded p-3">
          <h2 className="font-medium mb-2">Memory browser ({results.length})</h2>
          <ul className="space-y-2">
            {results.map((entry) => (
              <li key={entry.id}>
                <button
                  className={`w-full text-left border rounded p-2 ${selected?.id === entry.id ? 'bg-gray-100' : ''}`}
                  onClick={() => setSelectedId(entry.id)}
                >
                  <div className="font-mono text-xs">{entry.id}</div>
                  <div className="text-sm truncate">{entry.content}</div>
                  <div className="text-xs text-gray-600">Relevance: {entry.metadata.relevance}</div>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="border rounded p-3 space-y-2">
          <h2 className="font-medium">Memory detail</h2>
          {!selected ? (
            <p className="text-sm text-gray-500">No memory entry selected.</p>
          ) : (
            <>
              <p className="text-sm">
                <strong>Content:</strong> {selected.content}
              </p>
              <p className="text-sm">
                <strong>Metadata:</strong> {JSON.stringify(selected.metadata)}
              </p>
              <div>
                <p className="text-sm font-medium mb-1">Embedding visualization</p>
                <div className="flex items-end gap-1 h-16">
                  {selected.embedding.map((value, index) => (
                    <div
                      key={index}
                      className="bg-blue-500 w-6"
                      style={{ height: `${Math.max(4, value * 64)}px` }}
                      title={value.toFixed(2)}
                    />
                  ))}
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      <section className="border rounded p-3 space-y-2">
        <h2 className="font-medium">Bulk operations</h2>
        <div className="flex flex-wrap gap-2">
          <button className="border rounded px-3 py-1" onClick={() => toJsonFile(results)}>
            Export tier
          </button>
          <button className="border rounded px-3 py-1" onClick={clearTier}>
            Clear tier
          </button>
        </div>
        <textarea
          className="w-full border rounded px-2 py-1 text-sm"
          rows={4}
          placeholder="Paste JSON array to import..."
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
        />
        <button className="border rounded px-3 py-1 bg-black text-white text-sm" onClick={importEntries}>
          Import
        </button>
      </section>
    </main>
  );
}

