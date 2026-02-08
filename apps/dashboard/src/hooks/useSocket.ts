import { useEffect, useRef, useState } from 'react';

export type SocketEvent = {
  type: string;
  data: any;
  timestamp: string;
};

export function useSocket(url = 'ws://localhost:3002') {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<SocketEvent[]>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const connect = () => {
      if (!isMounted) return;
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        if (!isMounted) return;
        setConnected(true);
      };

      socket.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const payload = JSON.parse(event.data) as SocketEvent;
          setEvents((prev) => [...prev.slice(-200), payload]);
        } catch {
          // Ignore malformed payloads
        }
      };

      socket.onclose = () => {
        if (!isMounted) return;
        setConnected(false);
        reconnectRef.current = window.setTimeout(connect, 5000);
      };

      socket.onerror = () => {
        if (!isMounted) return;
        socket.close();
      };
    };

    connect();

    return () => {
      isMounted = false;
      if (reconnectRef.current) {
        clearTimeout(reconnectRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [url]);

  const send = (payload: unknown) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(payload));
    }
  };

  return { connected, events, send };
}
