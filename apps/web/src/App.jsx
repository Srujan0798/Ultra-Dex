// Copyright (c) 2026 Ultra-Dex
import { useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import './App.css';

const AGENTS = [
  { id: 'orchestrator', name: 'Orchestrator', specialty: 'Central Swarm Coordination' },
  { id: 'cto', name: 'CTO', specialty: 'Architecture & Governance' },
  { id: 'backend', name: 'Backend', specialty: 'APIs & Relational Memory' },
  { id: 'frontend', name: 'Frontend', specialty: 'React 19 & UX' },
  { id: 'security', name: 'Security', specialty: 'Docker Sandbox & Audit' },
];

const DEFAULT_CODE = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Ultra-Dex v6.0.0 Preview</title>
    <style>
      body { font-family: 'Space Grotesk', sans-serif; padding: 32px; background: #0f1014; color: #f8fafc; }
      .card { background: #1b1d23; padding: 24px; border-radius: 16px; border: 1px solid #2d2f36; }
      .accent { color: #a855f7; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Ultra-Dex v6.0.0 Meta-Layer</h1>
      <p>The ultimate architectural foundation for autonomous AI agents.</p>
      <p class="accent">Secure. Persistent. Autonomous.</p>
    </div>
  </body>
</html>`;

const DEFAULT_WS = 'ws://localhost:3002/ws';

function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState('html');
  const [wsUrl, setWsUrl] = useState(DEFAULT_WS);
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0].id);
  const [collabLog, setCollabLog] = useState([]);

  const wsRef = useRef(null);
  const termRef = useRef(null);
  const termContainerRef = useRef(null);

  const activeAgent = useMemo(
    () => AGENTS.find((agent) => agent.id === selectedAgent),
    [selectedAgent]
  );

  useEffect(() => {
    const term = new Terminal({
      fontFamily: '"Fira Code", monospace',
      fontSize: 12,
      theme: { background: '#0b0c10', foreground: '#e5e7eb' },
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(termContainerRef.current);
    fitAddon.fit();
    term.writeln('Ultra-Dex Terminal Ready (v6.0.0)');
    termRef.current = term;

    return () => term.dispose();
  }, []);

  useEffect(() => {
    if (!wsUrl) return;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onopen = () => setWsStatus('connected');
    ws.onclose = () => setWsStatus('disconnected');
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'code') setCode(msg.value);
      } catch (e) {}
    };
    return () => ws.close();
  }, [wsUrl]);

  return (
    <div className="ide-shell">
      <header className="ide-header">
        <h1>Ultra-Dex Build Studio</h1>
        <div className={`status-pill ${wsStatus}`}>{wsStatus}</div>
      </header>
      <div className="ide-grid">
        <aside className="panel agents">
          {AGENTS.map(agent => (
            <button key={agent.id} className={selectedAgent === agent.id ? 'active' : ''} onClick={() => setSelectedAgent(agent.id)}>
              {agent.name}
            </button>
          ))}
        </aside>
        <main className="panel editor">
          <Editor height="100%" language={language} value={code} theme="vs-dark" onChange={val => setCode(val)} />
        </main>
        <section className="panel terminal" ref={termContainerRef} />
      </div>
    </div>
  );
}

export default App;