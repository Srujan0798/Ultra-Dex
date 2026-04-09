// apps/dashboard/pages/_app.js
import '../styles/globals.css';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../contexts/AuthContext';
import { WebSocketProvider } from '../contexts/WebSocketContext';

function MyApp({ Component, pageProps }) {
  return (
    <ThemeProvider attribute="class">
      <AuthProvider>
        <WebSocketProvider>
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <Component {...pageProps} />
          </div>
          <Toaster position="bottom-right" />
        </WebSocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default MyApp;
