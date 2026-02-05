import { getAuth } from '@clerk/remix/ssr.server'
import type { LoaderFunctionArgs } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { db } from '~/lib/db.server'

export const loader = async (args: LoaderFunctionArgs) => {
    const { userId } = await getAuth(args)

    if (!userId) {
        return redirect('/sign-in')
    }

    const user = await db.user.findUnique({
        where: { clerkId: userId },
        include: {
            subscription: true,
            usage: {
                where: {
                    month: new Date().getMonth() + 1,
                    year: new Date().getFullYear(),
                },
            },
        },
    })

    return json({ user })
}

export default function Dashboard() {
    const { user } = useLoaderData<typeof loader>()

    return (
        <main className="min-h-screen bg-gray-900 text-white p-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-12">
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <span className="px-3 py-1 rounded bg-primary/20 text-primary text-sm">
                        {user?.subscription?.plan || 'FREE'}
                    </span>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h3 className="text-gray-400 text-sm mb-2">Current Plan</h3>
                        <p className="text-2xl font-bold">{user?.subscription?.plan || 'Free'}</p>
                    </div>

                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h3 className="text-gray-400 text-sm mb-2">API Calls This Month</h3>
                        <p className="text-2xl font-bold">
                            {user?.usage?.reduce((acc: number, u: any) => acc + u.count, 0) || 0}
                        </p>
                    </div>

                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <h3 className="text-gray-400 text-sm mb-2">Status</h3>
                        <p className="text-2xl font-bold text-green-400">
                            {user?.subscription?.status || 'Active'}
                        </p>
                    </div>
                </div>

                <section className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <button className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition">
                            📊 View Analytics
                        </button>
                        <button className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition">
                            ⚙️ Settings
                        </button>
                        <button className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition">
                            📝 API Keys
                        </button>
                        <button className="p-4 bg-primary/20 rounded-lg hover:bg-primary/30 transition text-primary">
                            ⬆️ Upgrade Plan
                        </button>
                    </div>
                </section>
            </div>
        </main>
    )
}
