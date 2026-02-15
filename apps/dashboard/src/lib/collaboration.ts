export interface CollaborationEvent<T = Record<string, unknown>> {
  id: string;
  roomId: string;
  userId: string;
  type: 'presence' | 'edit-lock' | 'activity';
  payload: T;
  timestamp: string;
}

export interface CollaborationChannel {
  publish: (event: CollaborationEvent) => void;
  subscribe: (listener: (event: CollaborationEvent) => void) => () => void;
  close: () => void;
}

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function storageEventKey(roomId: string): string {
  return `ultra-dex.collab.${roomId}`;
}

export function createCollaborationChannel(roomId: string): CollaborationChannel {
  const channelName = `ultra-dex-dashboard:${roomId}`;
  const listeners = new Set<(event: CollaborationEvent) => void>();
  const hasBroadcast = typeof BroadcastChannel !== 'undefined';
  const broadcast = hasBroadcast ? new BroadcastChannel(channelName) : null;

  const dispatch = (event: CollaborationEvent): void => {
    for (const listener of listeners) {
      listener(event);
    }
  };

  const onStorage = (event: StorageEvent): void => {
    if (event.key !== storageEventKey(roomId) || !event.newValue) return;
    try {
      const parsed = JSON.parse(event.newValue) as CollaborationEvent;
      dispatch(parsed);
    } catch {
      // no-op
    }
  };

  if (broadcast) {
    broadcast.onmessage = (message: MessageEvent<CollaborationEvent>) => {
      if (message?.data) dispatch(message.data);
    };
  } else if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorage);
  }

  return {
    publish: (event) => {
      const enriched: CollaborationEvent = {
        ...event,
        id: event.id || makeId(),
        roomId,
        timestamp: event.timestamp || new Date().toISOString(),
      };

      if (broadcast) {
        broadcast.postMessage(enriched);
      } else if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageEventKey(roomId), JSON.stringify(enriched));
      }
      dispatch(enriched);
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    close: () => {
      listeners.clear();
      if (broadcast) {
        broadcast.close();
      } else if (typeof window !== 'undefined') {
        window.removeEventListener('storage', onStorage);
      }
    },
  };
}
