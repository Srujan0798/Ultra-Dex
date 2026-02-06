import './globals.css';

export const metadata = {
  title: 'Ultra-Dex Cloud',
  description: 'Ultra-Dex hosted platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="layout">
          <aside className="sidebar">
            <h1>Ultra-Dex Cloud</h1>
            <nav className="nav">
              <a href="/">Overview</a>
              <a href="/dashboard">Dashboard</a>
              <a href="/enterprise">Enterprise</a>
              <a href="/marketplace">Marketplace</a>
              <a href="/teams">Teams</a>
              <a href="/billing">Billing</a>
              <a href="/usage">Usage</a>
              <a href="/api-keys">API Keys</a>
            </nav>
          </aside>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
