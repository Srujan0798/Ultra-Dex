import { useEffect, useRef, useState } from 'react';

type WebSocketStatus = 'connecting' | 'open' | 'closed' | 'error';

interface WebSocketOptions<T> {
  reconnect?: boolean;
  reconnectInterval?: number;
  onMessage?: (data: T) => void;
}

export function useWebSocket<T = unknown>(
  url: string,
  options: WebSocketOptions<T> = {}
) {
  const { reconnect = true, reconnectInterval = 5000, onMessage } = options;
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<WebSocketStatus>('connecting');
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<number | null>(null);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;

    const connect = () => {
      if (!url) return;
      setStatus('connecting');

      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        setStatus('open');
        setError(null);
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as T;
          setData(parsed);
          if (onMessage) onMessage(parsed);
        } catch (err) {
          setError((err as Error).message);
        }
      };

      socket.onerror = () => {
        setStatus('error');
      };

      socket.onclose = () => {
        setStatus('closed');
        if (reconnect && aliveRef.current) {
          if (reconnectRef.current) {
            window.clearTimeout(reconnectRef.current);
          }
          reconnectRef.current = window.setTimeout(connect, reconnectInterval);
        }
      };
    };

    connect();

    return () => {
      aliveRef.current = false;
      if (reconnectRef.current) {
        window.clearTimeout(reconnectRef.current);
      }
      socketRef.current?.close();
    };
  }, [url, reconnect, reconnectInterval, onMessage]);

  return {
    data,
    status,
    connected: status === 'open',
    error,
  };
}
