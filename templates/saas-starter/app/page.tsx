import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl font-bold">Ultra-Dex SaaS Starter</h1>
      <p className="text-slate-400">
        Next.js 15 starter with auth, billing, and Prisma ready to go.
      </p>
      <div className="flex gap-3">
        <Link
          className="rounded bg-indigo-500 px-4 py-2 font-semibold text-white"
          href="/api/auth/signin"
        >
          Sign in
        </Link>
        <Link className="rounded border border-slate-600 px-4 py-2" href="/dashboard">
          Dashboard
        </Link>
      </div>
    </main>
  );
}
