import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [status, setStatus] = useState('Initializing...');
  const [projects, setProjects] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Simulate connecting to Ultra-Dex CLI
  useEffect(() => {
    const connectToUltraDex = async () => {
      try {
        if (window.ultraDex) {
          setStatus('Connected to Ultra-Dex');
          // Simulate fetching project data
          setTimeout(() => {
            setProjects([
              { id: 1, name: 'E-commerce Platform', status: 'Active', progress: 75 },
              { id: 2, name: 'Mobile App', status: 'Planning', progress: 20 },
              { id: 3, name: 'Analytics Dashboard', status: 'Completed', progress: 100 },
            ]);
          }, 1000);
        } else {
          setStatus('Not connected to Ultra-Dex CLI');
        }
      } catch (error) {
        setStatus('Connection error');
        console.error('Error connecting to Ultra-Dex:', error);
      }
    };

    connectToUltraDex();
  }, []);

  const runCommand = async (command) => {
    if (window.ultraDex) {
      try {
        const result = await window.ultraDex.runCommand(command);
        console.log('Command result:', result);
      } catch (error) {
        console.error('Command error:', error);
      }
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>.Ultra-Dex Desktop</h1>
        <div className="status-bar">
          <span className={`status-indicator ${status.includes('Connected') ? 'connected' : 'disconnected'}`}>
            {status}
          </span>
        </div>
      </header>

      <nav className="app-nav">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''} 
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button 
          className={activeTab === 'projects' ? 'active' : ''} 
          onClick={() => setActiveTab('projects')}
        >
          Projects
        </button>
        <button 
          className={activeTab === 'agents' ? 'active' : ''} 
          onClick={() => setActiveTab('agents')}
        >
          Agents
        </button>
        <button 
          className={activeTab === 'settings' ? 'active' : ''} 
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'dashboard' && (
          <div className="dashboard">
            <h2>Project Dashboard</h2>
            <div className="quick-actions">
              <button onClick={() => runCommand('ultra-dex plan "New feature"')}>
                Plan New Feature
              </button>
              <button onClick={() => runCommand('ultra-dex run task.md')}>
                Run Task
              </button>
              <button onClick={() => runCommand('ultra-dex verify --full')}>
                Verify Project
              </button>
              <button onClick={() => runCommand('ultra-dex swarm start --parallel 3')}>
                Start Swarm
              </button>
            </div>
            
            <div className="project-summary">
              <h3>Active Projects</h3>
              {projects.length > 0 ? (
                <ul className="project-list">
                  {projects.map(project => (
                    <li key={project.id} className="project-item">
                      <div className="project-info">
                        <h4>{project.name}</h4>
                        <span className={`status-badge ${project.status.toLowerCase()}`}>
                          {project.status}
                        </span>
                      </div>
                      <div className="progress-container">
                        <div 
                          className="progress-bar" 
                          style={{ width: `${project.progress}%` }}
                        ></div>
                        <span className="progress-text">{project.progress}%</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No projects found. Initialize a new project to get started.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="projects-tab">
            <h2>Projects</h2>
            <p>Manage your Ultra-Dex projects here.</p>
          </div>
        )}

        {activeTab === 'agents' && (
          <div className="agents-tab">
            <h2>Agents</h2>
            <p>Monitor and manage your AI agents.</p>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-tab">
            <h2>Settings</h2>
            <p>Configure Ultra-Dex settings.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;