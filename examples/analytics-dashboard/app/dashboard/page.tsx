/**
 * @fileoverview Page module
 * @module dashboard/page
 */

'use client';

import React, { useState } from 'react';
import { Sidebar, Header } from '@/app/components/layout';
import { DashboardGrid } from '@/app/components/dashboard-grid';

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="lg:pl-64">
        <Header setSidebarOpen={setSidebarOpen} />

        <main className="p-4 sm:p-6 lg:p-8">
          <DashboardGrid />
        </main>
      </div>
    </div>
  );
}

/**
 * Error handler for page
 * @param {Error} error - Error to handle
 */
function handlePageError(error) {
  try {
    console.error('[page]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
