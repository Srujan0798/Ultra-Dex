// apps/dashboard/components/DashboardLayout.js
import React from 'react';
import { useRouter } from 'next/router';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { WebSocketStatus } from './WebSocketStatus';

export function DashboardLayout({ children }) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <WebSocketStatus />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
