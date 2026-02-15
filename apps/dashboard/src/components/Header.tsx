import { memo } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { GlobalSearch } from './GlobalSearch';
import { NotificationCenter } from './NotificationCenter';
import { SettingsPanel } from './SettingsPanel';

interface HeaderProps {
  title: string;
  connected?: boolean;
}

export const Header = memo(function Header({ title, connected = false }: HeaderProps) {
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

      <div className="flex items-center gap-3">
        <GlobalSearch />
        <NotificationCenter connected={connected} />
        <SettingsPanel />

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
});
