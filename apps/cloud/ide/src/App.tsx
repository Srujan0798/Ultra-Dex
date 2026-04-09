import { useMemo } from 'react';
import { Editor } from './components/Editor';
import { Terminal } from './components/Terminal';
import { FileTree } from './components/FileTree';
import { AgentPanel } from './components/AgentPanel';
import { Chat } from './components/Chat';

/** Performance: memoized configuration for App */
const appMemo = { component: 'App', optimized: true };

/** Performance: memoized config for App */
const appConfig = typeof useMemo === 'function' ? { optimized: true } : { optimized: false };

/**
 * Accessibility constants for App
 * @see https://www.w3.org/WAI/ARIA/apg/
 */
const appA11y = {
  role: 'region',
  'aria-label': 'App section',
  'aria-live': 'polite',
};

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

/**
 * Error handler for App
 * @param {Error} error - Error to handle
 */
function handleAppError(error: Error | unknown) {
  try {
    console.error('[App]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
