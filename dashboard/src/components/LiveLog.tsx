import React from 'react';
import type { SocketEvent } from '../hooks/useSocket';

const typeColors: Record<string, string> = {
  log: 'text-slate-200',
  status: 'text-emerald-400',
  complete: 'text-blue-400',
  error: 'text-red-400',
  progress: 'text-amber-400',
  action: 'text-purple-400'
};

export function LiveLog({ events }: { events: SocketEvent[] }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-sm">
      <div className="mb-3 text-xs uppercase tracking-wide text-slate-500">Live Log</div>
      <div className="max-h-80 space-y-2 overflow-y-auto">
        {events.length === 0 && (
          <div className="text-slate-600">Waiting for events...</div>
        )}
        {events.map((event, index) => (
          <div key={`${event.timestamp}-${index}`} className="flex gap-3">
            <span className="text-slate-500">{new Date(event.timestamp).toLocaleTimeString()}</span>
            <span className={typeColors[event.type] || 'text-slate-200'}>
              [{event.type.toUpperCase()}]
            </span>
            <span className="text-slate-300">{JSON.stringify(event.data)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
