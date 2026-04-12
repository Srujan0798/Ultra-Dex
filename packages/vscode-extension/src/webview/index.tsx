import * as React from 'react';
import { createRoot } from 'react-dom/client';

// Ultra-Dex VSCode Extension Webview
// Provides the UI for the sidebar panels

interface Agent {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'error';
  icon: string;
}

interface Task {
  id: string;
  agent: string;
  prompt: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  timestamp: number;
  output?: string;
}

const App: React.FC = () => {
  const [agents, setAgents] = React.useState<Agent[]>([
    { id: 'planner', name: 'Planner', description: 'Decomposes complex tasks', status: 'idle', icon: '📋' },
    { id: 'backend', name: 'Backend', description: 'Builds API and services', status: 'idle', icon: '⚙️' },
    { id: 'frontend', name: 'Frontend', description: 'Creates UI components', status: 'idle', icon: '🎨' },
    { id: 'debugger', name: 'Debugger', description: 'Finds and fixes bugs', status: 'idle', icon: '🐛' },
    { id: 'reviewer', name: 'Reviewer', description: 'Reviews code quality', status: 'idle', icon: '👀' },
  ]);

  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [selectedAgent, setSelectedAgent] = React.useState<string | null>(null);
  const [prompt, setPrompt] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'agents' | 'tasks' | 'memory'>('agents');

  const runTask = () => {
    if (!selectedAgent || !prompt) return;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      agent: selectedAgent,
      prompt,
      status: 'pending',
      timestamp: Date.now(),
    };

    setTasks([newTask, ...tasks]);
    setPrompt('');

    // Notify extension host
    if (typeof vscode !== 'undefined') {
      vscode.postMessage({ type: 'runTask', agent: selectedAgent, prompt });
    }
  };

  const stopTask = (taskId: string) => {
    if (typeof vscode !== 'undefined') {
      vscode.postMessage({ type: 'stopTask', taskId });
    }
  };

  const replayTask = (task: Task) => {
    setSelectedAgent(task.agent);
    setPrompt(task.prompt);
    setActiveTab('agents');
  };

  // Listen for messages from extension host
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.type) {
        case 'taskUpdate':
          setTasks((prev) =>
            prev.map((t) =>
              t.id === message.taskId
                ? { ...t, status: message.status, output: message.output }
                : t
            )
          );
          break;
        case 'agentsUpdate':
          setAgents(message.agents);
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div style={{ padding: '10px', fontFamily: 'system-ui, sans-serif' }}>
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #e0e0e0' }}>
        <button
          onClick={() => setActiveTab('agents')}
          style={{
            padding: '8px 12px',
            border: 'none',
            background: activeTab === 'agents' ? '#007acc' : 'transparent',
            color: activeTab === 'agents' ? 'white' : '#333',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0',
          }}
        >
          Agents
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          style={{
            padding: '8px 12px',
            border: 'none',
            background: activeTab === 'tasks' ? '#007acc' : 'transparent',
            color: activeTab === 'tasks' ? 'white' : '#333',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0',
          }}
        >
          Tasks ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab('memory')}
          style={{
            padding: '8px 12px',
            border: 'none',
            background: activeTab === 'memory' ? '#007acc' : 'transparent',
            color: activeTab === 'memory' ? 'white' : '#333',
            cursor: 'pointer',
            borderRadius: '4px 4px 0 0',
          }}
        >
          Memory
        </button>
      </div>

      {/* Agents Tab */}
      {activeTab === 'agents' && (
        <div>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Select Agent</h3>
          {agents.map((agent) => (
            <div
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              style={{
                padding: '12px',
                marginBottom: '8px',
                border: `1px solid ${selectedAgent === agent.id ? '#007acc' : '#e0e0e0'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                background: selectedAgent === agent.id ? '#e3f2fd' : 'white',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>{agent.icon}</span>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{agent.name}</div>
                  <div style={{ fontSize: '11px', color: '#666' }}>{agent.description}</div>
                </div>
              </div>
              <div
                style={{
                  marginTop: '6px',
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  display: 'inline-block',
                  background:
                    agent.status === 'running'
                      ? '#fff3cd'
                      : agent.status === 'error'
                      ? '#f8d7da'
                      : '#d4edda',
                  color:
                    agent.status === 'running'
                      ? '#856404'
                      : agent.status === 'error'
                      ? '#721c24'
                      : '#155724',
                }}
              >
                {agent.status}
              </div>
            </div>
          ))}

          {selectedAgent && (
            <div style={{ marginTop: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '13px' }}>Task Prompt</h4>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your task..."
                style={{
                  width: '100%',
                  height: '100px',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '12px',
                  resize: 'vertical',
                }}
              />
              <button
                onClick={runTask}
                disabled={!prompt}
                style={{
                  marginTop: '8px',
                  width: '100%',
                  padding: '10px',
                  background: prompt ? '#007acc' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: prompt ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold',
                }}
              >
                ▶ Run Task
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Recent Tasks</h3>
          {tasks.length === 0 ? (
            <div style={{ color: '#666', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
              No tasks yet. Run an agent from the Agents tab.
            </div>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  padding: '10px',
                  marginBottom: '8px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '4px',
                  background: '#f9f9f9',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '12px' }}>{task.agent}</span>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      background:
                        task.status === 'running'
                          ? '#fff3cd'
                          : task.status === 'completed'
                          ? '#d4edda'
                          : task.status === 'failed'
                          ? '#f8d7da'
                          : '#e2e3e5',
                      color:
                        task.status === 'running'
                          ? '#856404'
                          : task.status === 'completed'
                          ? '#155724'
                          : task.status === 'failed'
                          ? '#721c24'
                          : '#383d41',
                    }}
                  >
                    {task.status}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#333',
                    marginTop: '4px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {task.prompt}
                </div>
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                  {task.status === 'running' && (
                    <button
                      onClick={() => stopTask(task.id)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '10px',
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                      }}
                    >
                      Stop
                    </button>
                  )}
                  <button
                    onClick={() => replayTask(task)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '10px',
                      background: '#6c757d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                    }}
                  >
                    Replay
                  </button>
                </div>
                {task.output && (
                  <pre
                    style={{
                      marginTop: '8px',
                      padding: '8px',
                      background: '#f5f5f5',
                      fontSize: '10px',
                      maxHeight: '100px',
                      overflow: 'auto',
                      borderRadius: '3px',
                    }}
                  >
                    {task.output.slice(0, 500)}
                    {task.output.length > 500 && '...'}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Memory Tab */}
      {activeTab === 'memory' && (
        <div>
          <h3 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>Memory Search</h3>
          <input
            type="text"
            placeholder="Search past executions..."
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          />
          <div style={{ marginTop: '12px', color: '#666', fontSize: '12px' }}>
            <p>Memory features:</p>
            <ul style={{ paddingLeft: '16px' }}>
              <li>3-tier persistence (L1/L2/L3)</li>
              <li>Semantic vector search</li>
              <li>RAG-augmented prompts</li>
              <li>Cross-execution learning</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

// Mount the app
const container = document.getElementById('ultra-dex-root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
