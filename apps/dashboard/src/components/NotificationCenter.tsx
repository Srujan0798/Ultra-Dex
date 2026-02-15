import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';

export interface DashboardNotification {
  id: string;
  title: string;
  body: string;
  level: 'info' | 'warn' | 'error' | 'success';
  timestamp: string;
  read: boolean;
}

const STORAGE_KEY = 'ultra-dex.dashboard.notifications.v1';

function readNotifications(): DashboardNotification[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DashboardNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistNotifications(notifications: DashboardNotification[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, 50)));
  } catch {
    // no-op
  }
}

export function NotificationCenter({ connected }: { connected: boolean }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);

  useEffect(() => {
    const existing = readNotifications();
    setNotifications(existing);
    if (existing.length === 0) {
      const seed: DashboardNotification = {
        id: crypto.randomUUID(),
        title: 'Dashboard initialized',
        body: 'Notification center is active and persisting events locally.',
        level: 'info',
        timestamp: new Date().toISOString(),
        read: false,
      };
      setNotifications([seed]);
      persistNotifications([seed]);
    }
  }, []);

  useEffect(() => {
    if (!notifications.length) return;
    persistNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    setNotifications((previous) => {
      const status = connected ? 'Live connection restored' : 'Connection dropped';
      const alreadyLatest = previous[0]?.title === status;
      if (alreadyLatest) return previous;

      const next: DashboardNotification = {
        id: crypto.randomUUID(),
        title: status,
        body: connected
          ? 'Realtime stream is connected and healthy.'
          : 'Realtime stream disconnected. Auto-reconnect in progress.',
        level: connected ? 'success' : 'warn',
        timestamp: new Date().toISOString(),
        read: false,
      };
      return [next, ...previous].slice(0, 50);
    });
  }, [connected]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const markAllRead = (): void => {
    setNotifications((previous) => previous.map((item) => ({ ...item, read: true })));
  };

  const markRead = (id: string): void => {
    setNotifications((previous) =>
      previous.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Open notifications"
        onClick={() => setOpen((previous) => !previous)}
        className="relative rounded-full border border-slate-800 bg-slate-900/70 p-2 text-slate-300 hover:border-emerald-500/50 hover:text-slate-100"
      >
        <Bell className="h-4 w-4" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 rounded-full bg-emerald-500 px-1.5 text-[10px] font-semibold text-slate-950">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-3 w-96 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-100">Notifications</h3>
            <button
              type="button"
              onClick={markAllRead}
              className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Mark all read
            </button>
          </div>

          <ul className="max-h-[360px] divide-y divide-slate-800 overflow-y-auto">
            {notifications.length === 0 && (
              <li className="px-4 py-6 text-center text-xs text-slate-500">No notifications.</li>
            )}
            {notifications.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => markRead(item.id)}
                  className={`w-full px-4 py-3 text-left ${item.read ? 'bg-slate-950' : 'bg-slate-900/70'} hover:bg-slate-800/70`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-slate-100">{item.title}</p>
                    <span className="text-[10px] uppercase tracking-[0.15em] text-slate-500">
                      {item.level}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{item.body}</p>
                  <p className="mt-2 text-[11px] text-slate-500">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
