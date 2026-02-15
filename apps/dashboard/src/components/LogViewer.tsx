import { memo, useMemo, useState } from 'react';
import type { DashboardLogEntry } from '../lib/websocket';

interface LogViewerProps {
  logs: DashboardLogEntry[];
}

type LevelFilter = 'all' | 'info' | 'warn' | 'error' | 'success';

function downloadLogs(filename: string, logs: DashboardLogEntry[]) {
  const lines = logs.map((log) => `${log.timestamp} [${log.level.toUpperCase()}] ${log.message}`);
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

const levelColor: Record<DashboardLogEntry['level'], string> = {
  info: 'text-blue-300',
  warn: 'text-amber-300',
  error: 'text-rose-300',
  success: 'text-emerald-300',
};

export const LogViewer = memo(function LogViewer({ logs }: LogViewerProps) {
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<LevelFilter>('all');

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const levelMatch = level === 'all' || log.level === level;
      const searchMatch =
        search.trim().length === 0 ||
        log.message.toLowerCase().includes(search.toLowerCase()) ||
        log.timestamp.toLowerCase().includes(search.toLowerCase());

      return levelMatch && searchMatch;
    });
  }, [logs, level, search]);

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-100">Live Log Viewer</h3>
        <div className="flex flex-wrap items-center gap-2">
          <input
            className="rounded-md border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-200"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search logs"
            value={search}
          />
          <select
            className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-300"
            onChange={(event) => setLevel(event.target.value as LevelFilter)}
            value={level}
          >
            <option value="all">All levels</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
            <option value="success">Success</option>
          </select>
          <button
            className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-blue-500/40"
            onClick={() => downloadLogs('ultra-dex-live-logs.txt', filtered)}
            type="button"
          >
            Export Logs
          </button>
        </div>
      </header>

      <div className="mt-4 h-72 overflow-auto rounded-xl border border-slate-800 bg-slate-950/70 p-3 font-mono text-xs">
        {filtered.length === 0 ? (
          <p className="text-slate-500">No log entries match the current filters.</p>
        ) : (
          filtered.map((log) => (
            <div key={log.id} className="border-b border-slate-900/70 py-2">
              <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>{' '}
              <span className={levelColor[log.level]}>{log.level.toUpperCase()}</span>{' '}
              <span className="text-slate-200">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </section>
  );
});
