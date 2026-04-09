import { memo, useState, useEffect } from 'react';

export const Terminal = memo(function Terminal() {
  const [logs, setLogs] = useState([
    'Ultra-Dex Cloud IDE v6.0.0 initializing...',
    'Connecting to swarm-cluster-alpha...',
    'Operational.',
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const mockLogs = [
        '[info] Agent Reviewer completed security scan.',
        '[system] Meta-Layer heartbeat stable.',
        '[info] Coder-V6 pushed 4 changes to local memory.',
      ];
      setLogs((prev) =>
        [...prev, mockLogs[Math.floor(Math.random() * mockLogs.length)]].slice(-10)
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="panel"
      style={{
        height: '30%',
        background: '#000',
        color: '#10b981',
        fontFamily: 'monospace',
        fontSize: '12px',
        overflowY: 'auto',
        padding: '12px',
      }}
    >
      {logs.map((log, i) => (
        <div key={i}>$ {log}</div>
      ))}
      <div style={{ display: 'flex' }}>
        <span>$ </span>
        <span style={{ borderRight: '2px solid #10b981', animation: 'blink 1s infinite' }}>
          &nbsp;
        </span>
      </div>
      <style>{`
        @keyframes blink { 50% { opacity: 0; } }
      `}</style>
    </div>
  );
});
