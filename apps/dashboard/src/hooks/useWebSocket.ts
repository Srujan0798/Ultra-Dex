/**
 * @fileoverview UseWebSocket module
 * @module hooks/useWebSocket
 */

import { useEffect, useRef, useState, useMemo } from 'react';

type WebSocketStatus = 'connecting' | 'open' | 'closed' | 'error';

interface WebSocketOptions<T> {
  reconnect?: boolean;
  reconnectInterval?: number;
  onMessage?: (data: T) => void;
}

export function useWebSocket<T = unknown>(url: string, options: WebSocketOptions<T> = {}) {
  const { reconnect = true, reconnectInterval = 5000, onMessage } = options;
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<WebSocketStatus>('connecting');
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<number | null>(null);
  const aliveRef = useRef(true);

  // Use a ref for onMessage to prevent effect re-runs
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    aliveRef.current = true; // Reset alive state on mount/url change

    const connect = () => {
      if (!url) return;
      setStatus('connecting');

      try {
        const socket = new WebSocket(url);
        socketRef.current = socket;

        socket.onopen = () => {
          if (aliveRef.current) {
            setStatus('open');
            setError(null);
          }
        };

        socket.onmessage = (event) => {
          if (!aliveRef.current) return;
          try {
            const parsed = JSON.parse(event.data) as T;
            setData(parsed);
            if (onMessageRef.current) {
              onMessageRef.current(parsed);
            }
          } catch (err) {
            console.error('[WebSocket] Parse error:', err);
            // Don't set global error for parse failures to keep connection alive
          }
        };

        socket.onerror = (event) => {
          if (aliveRef.current) {
            console.error('[WebSocket] Error:', event);
            setStatus('error');
            setError('Connection failed');
          }
        };

        socket.onclose = () => {
          if (aliveRef.current) {
            setStatus('closed');
            if (reconnect) {
              if (reconnectRef.current) {
                window.clearTimeout(reconnectRef.current);
              }
              reconnectRef.current = window.setTimeout(() => {
                if (aliveRef.current) connect();
              }, reconnectInterval);
            }
          }
        };
      } catch (err) {
        if (aliveRef.current) {
          setStatus('error');
          setError((err as Error).message);
        }
      }
    };

    connect();

    return () => {
      aliveRef.current = false;
      if (reconnectRef.current) {
        window.clearTimeout(reconnectRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [url, reconnect, reconnectInterval]); // onMessage removed from deps

  return useMemo(
    () => ({
      data,
      status,
      connected: status === 'open',
      error,
    }),
    [data, status, error]
  );
}
