// apps/dashboard/lib/websocket.ts
import { useEffect, useState, useCallback } from 'react';

export interface WSMessage {
  type: string;
  payload: any;
  timestamp: string;
}

export function useUltraDexSocket(url: string = 'ws://localhost:4000/ws') {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('Connected to Ultra-Dex WebSocket');
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
      } catch (e) {
        console.error('Failed to parse WS message', e);
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from Ultra-Dex WebSocket');
      setConnected(false);
      // Reconnect logic could go here
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [url]);

  const sendMessage = useCallback((type: string, payload: any) => {
    if (socket && connected) {
      socket.send(JSON.stringify({ type, payload }));
    }
  }, [socket, connected]);

  return { connected, lastMessage, sendMessage };
}
