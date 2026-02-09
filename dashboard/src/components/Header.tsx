import { Search, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  title: string;
  connected?: boolean;
}

export function Header({ title, connected }: HeaderProps) {
  return (
    <header
      className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 px-6 py-4 backdrop-blur"
      role="banner"
      aria-label="Dashboard header"
    >
      <div>
        <h1 className="text-xl font-semibold text-slate-100">{title}</h1>
        <p className="text-sm text-slate-500">
          Real-time systems telemetry and orchestration overview.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden items-center md:flex">
          <Search className="absolute left-3 h-4 w-4 text-slate-500" aria-hidden="true" />
          <input
            placeholder="Search tasks, agents, logs..."
            aria-label="Search tasks, agents, and logs"
            className="w-64 rounded-full border border-slate-800 bg-slate-900/60 py-2 pl-9 pr-4 text-sm text-slate-200 focus:border-emerald-500/60 focus:outline-none"
          />
        </div>

        <div
          className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1 text-xs text-slate-400"
          role="status"
          aria-live="polite"
          aria-label={connected ? 'Connection status: Live' : 'Connection status: Offline'}
        >
          {connected ? (
            <>
              <Wifi className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              Live
            </>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
              Offline
            </>
          )}
        </div>
      </div>
    </header>
  );
}
