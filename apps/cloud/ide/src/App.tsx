import { Editor } from './components/Editor';
import { Terminal } from './components/Terminal';
import { FileTree } from './components/FileTree';
import { AgentPanel } from './components/AgentPanel';
import { Chat } from './components/Chat';

export default function App() {
  return (
    <div className="app-shell">
      <aside className="panel">
        <FileTree />
      </aside>
      <main className="panel">
        <Editor />
        <Terminal />
      </main>
      <aside className="panel">
        <AgentPanel />
        <Chat />
      </aside>
    </div>
  );
}
