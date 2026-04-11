/**
 * @fileoverview Layout module
 * @module dashboard/layout
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader user={session.user} />
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

/**
 * Error handler for layout
 * @param {Error} error - Error to handle
 */
function handleLayoutError(error) {
  try {
    console.error('[layout]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
