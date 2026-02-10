/**
 * @fileoverview Page module
 * @module admin/page
 */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';

export default async function AdminPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });

  if (user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const [users, subscriptions, invoices] = await Promise.all([
    db.user.count(),
    db.subscription.groupBy({
      by: ['plan'],
      _count: true,
    }),
    db.invoice.aggregate({
      _sum: { amount: true },
      where: { status: 'PAID' },
    }),
  ]);

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-3xl font-bold text-red-400">Admin Dashboard</h1>
          <p className="text-gray-400 mt-2">System administration panel</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gray-800 rounded-xl p-6 border border-red-900/50">
            <h3 className="text-gray-400 text-sm mb-2">Total Users</h3>
            <p className="text-3xl font-bold">{users}</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-red-900/50">
            <h3 className="text-gray-400 text-sm mb-2">Pro Users</h3>
            <p className="text-3xl font-bold text-primary">
              {subscriptions.find((s) => s.plan === 'PRO')?._count || 0}
            </p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-red-900/50">
            <h3 className="text-gray-400 text-sm mb-2">Enterprise</h3>
            <p className="text-3xl font-bold text-yellow-400">
              {subscriptions.find((s) => s.plan === 'ENTERPRISE')?._count || 0}
            </p>
          </div>

          <div className="bg-gray-800 rounded-xl p-6 border border-red-900/50">
            <h3 className="text-gray-400 text-sm mb-2">Total Revenue</h3>
            <p className="text-3xl font-bold text-green-400">
              ${((invoices._sum.amount || 0) / 100).toLocaleString()}
            </p>
          </div>
        </div>

        <section className="bg-gray-800 rounded-xl p-6 border border-red-900/50 mb-6">
          <h2 className="text-xl font-semibold mb-4">Admin Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition">
              👥 Manage Users
            </button>
            <button className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition">
              💳 View Invoices
            </button>
            <button className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition">
              🎛️ Feature Flags
            </button>
            <button className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition">
              📊 Analytics
            </button>
          </div>
        </section>
      </div>
    </main>
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
