import { useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import './App.css';

const AGENTS = [
  { id: 'architect', name: 'Architect', specialty: 'System design & constraints' },
  { id: 'frontend', name: 'Frontend', specialty: 'UI flows & components' },
  { id: 'backend', name: 'Backend', specialty: 'APIs & data services' },
  { id: 'testing', name: 'Testing', specialty: 'QA & validation' },
  { id: 'reviewer', name: 'Reviewer', specialty: 'Code review & risk' }
];

const DEFAULT_CODE = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Ultra-Dex Live Preview</title>
    <style>
      body { font-family: 'Space Grotesk', sans-serif; padding: 32px; background: #0f1014; color: #f8fafc; }
      .card { background: #1b1d23; padding: 24px; border-radius: 16px; border: 1px solid #2d2f36; }
      .accent { color: #7bf1a8; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Ultra-Dex Agentic IDE</h1>
      <p>Live preview updates as you edit. Collaborators sync instantly.</p>
      <p class="accent">Deploy-ready with built-in agents.</p>
    </div>
  </body>
</html>`;

const DEFAULT_WS = 'ws://localhost:4002';

function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState('html');
  const [wsUrl, setWsUrl] = useState(DEFAULT_WS);
  const [wsStatus, setWsStatus] = useState('disconnected');
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0].id);
  const [collabLog, setCollabLog] = useState([]);

  const wsRef = useRef(null);
  const termRef = useRef(null);
  const fitRef = useRef(null);
  const termContainerRef = useRef(null);

  const activeAgent = useMemo(() => AGENTS.find(agent => agent.id === selectedAgent), [selectedAgent]);

  useEffect(() => {
    const term = new Terminal({
      fontFamily: '"Fira Code", monospace',
      fontSize: 12,
      theme: {
        background: '#0b0c10',
        foreground: '#e5e7eb',
        green: '#7bf1a8',
        blue: '#7aa2f7'
      }
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(termContainerRef.current);
    fitAddon.fit();
    term.writeln('Ultra-Dex Terminal Ready');
    term.writeln('Type commands to send via WebSocket.');

    term.onData((data) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'terminal', data }));
      }
    });

    termRef.current = term;
    fitRef.current = fitAddon;

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []);

  useEffect(() => {
    if (!wsUrl) return;

    if (wsRef.current) {
      wsRef.current.close();
    }

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      setWsStatus('connecting');

      ws.onopen = () => {
        setWsStatus('connected');
        setCollabLog((log) => [...log.slice(-4), `Connected to ${wsUrl}`]);
        ws.send(JSON.stringify({ type: 'presence', agent: selectedAgent }));
      };

      ws.onclose = () => {
        setWsStatus('disconnected');
        setCollabLog((log) => [...log.slice(-4), 'Disconnected from WebSocket']);
      };

      ws.onerror = () => {
        setWsStatus('error');
        setCollabLog((log) => [...log.slice(-4), 'WebSocket error']);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'code' && typeof message.value === 'string') {
            setCode(message.value);
          }
          if (message.type === 'terminal-output' && termRef.current) {
            termRef.current.write(message.data);
          }
          if (message.type === 'collab') {
            setCollabLog((log) => [...log.slice(-4), message.message]);
          }
        } catch {
          // ignore non-JSON payloads
        }
      };
    } catch {
      setWsStatus('error');
    }

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [wsUrl, selectedAgent]);

  const handleEditorChange = (value) => {
    const nextValue = value ?? '';
    setCode(nextValue);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'code', value: nextValue, agent: selectedAgent }));
    }
  };

  const previewMode = language === 'html';

  return (
    <div className="ide-shell">
      <header className="ide-header">
        <div>
          <p className="eyebrow">Ultra-Dex Agentic IDE</p>
          <h1>Browser-Based Build Studio</h1>
        </div>
        <div className="header-controls">
          <div className={`status-pill ${wsStatus}`}>{wsStatus}</div>
          <input
            className="ws-input"
            value={wsUrl}
            onChange={(event) => setWsUrl(event.target.value)}
            placeholder="ws://localhost:4002"
          />
        </div>
      </header>

      <div className="ide-grid">
        <aside className="panel agents">
          <div className="panel-header">
            <h2>Agents</h2>
            <p>Route work to a specialist.</p>
          </div>
          <div className="agent-list">
            {AGENTS.map((agent) => (
              <button
                key={agent.id}
                className={`agent-card ${selectedAgent === agent.id ? 'active' : ''}`}
                onClick={() => setSelectedAgent(agent.id)}
              >
                <strong>{agent.name}</strong>
                <span>{agent.specialty}</span>
              </button>
            ))}
          </div>
          <div className="agent-chat">
            <div className="chat-header">
              <h3>Chat with @{activeAgent?.name}</h3>
            </div>
            <div className="chat-messages">
              {collabLog.filter(l => l.includes('Agent') || l.includes('@{')).map((msg, idx) => (
                <div key={idx} className="message agent">
                  <p>{msg}</p>
                </div>
              ))}
              <div className="message system">
                <p>Welcome. I am the {activeAgent?.name} agent. How can I help you with your {language} code today?</p>
              </div>
            </div>
            <div className="chat-input-wrapper">
              <input 
                type="text" 
                placeholder={`Message @${activeAgent?.id}...`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value) {
                    const msg = e.target.value;
                    setCollabLog(prev => [...prev, `You: ${msg}`]);
                    if (wsRef.current?.readyState === WebSocket.OPEN) {
                      wsRef.current.send(JSON.stringify({ 
                        type: 'agent-chat', 
                        agent: selectedAgent, 
                        message: msg,
                        context: code 
                      }));
                    }
                    e.target.value = '';
                  }
                }}
              />
            </div>
          </div>
        </aside>

        <main className="panel editor">
          <div className="panel-header row">
            <div>
              <h2>Monaco Editor</h2>
              <p>Context-aware completions with shared state.</p>
            </div>
            <div className="controls">
              <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                <option value="html">HTML</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="markdown">Markdown</option>
                <option value="json">JSON</option>
              </select>
              <button
                type="button"
                onClick={() => setCode(DEFAULT_CODE)}
              >
                Reset
              </button>
            </div>
          </div>
          <div className="editor-shell">
            <Editor
              height="100%"
              defaultLanguage="html"
              language={language}
              value={code}
              onChange={handleEditorChange}
              theme="vs-dark"
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                wordWrap: 'on',
                smoothScrolling: true
              }}
            />
          </div>
        </main>

        <aside className="panel preview">
          <div className="panel-header">
            <h2>Live Preview</h2>
            <p>Instant feedback while you iterate.</p>
          </div>
          <div className="preview-shell">
            {previewMode ? (
              <iframe title="preview" srcDoc={code} sandbox="allow-scripts" />
            ) : (
              <div className="preview-placeholder">
                <p>Preview available for HTML content.</p>
                <p>Switch the language to HTML to render.</p>
              </div>
            )}
          </div>
          <div className="collab-feed">
            <h3>Collaboration Feed</h3>
            <ul>
              {collabLog.length === 0 ? (
                <li>No collaboration events yet.</li>
              ) : (
                collabLog.map((entry, index) => <li key={index}>{entry}</li>)
              )}
            </ul>
          </div>
        </aside>

        <section className="panel terminal">
          <div className="panel-header">
            <h2>Integrated Terminal</h2>
            <p>Stream output over WebSocket.</p>
          </div>
          <div className="terminal-shell" ref={termContainerRef} />
        </section>
      </div>
    </div>
  );
}

export default App;
