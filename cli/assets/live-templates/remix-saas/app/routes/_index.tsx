import { SignInButton, SignUpButton, UserButton } from '@clerk/remix'
import { getAuth } from '@clerk/remix/ssr.server'
import type { LoaderFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'

export const loader = async (args: LoaderFunctionArgs) => {
    const { userId } = await getAuth(args)
    return json({ userId })
}

export default function Index() {
    const { userId } = useLoaderData<typeof loader>()

    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
            <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto">
                <h1 className="text-2xl font-bold text-white">SaaS Name</h1>
                <div className="flex gap-4">
                    {userId ? (
                        <>
                            <Link
                                to="/dashboard"
                                className="px-4 py-2 rounded bg-primary hover:bg-primary/90 text-white"
                            >
                                Dashboard
                            </Link>
                            <UserButton />
                        </>
                    ) : (
                        <>
                            <SignInButton mode="modal">
                                <button className="px-4 py-2 rounded border border-white/20 hover:bg-white/10 text-white">
                                    Sign In
                                </button>
                            </SignInButton>
                            <SignUpButton mode="modal">
                                <button className="px-4 py-2 rounded bg-primary hover:bg-primary/90 text-white">
                                    Get Started
                                </button>
                            </SignUpButton>
                        </>
                    )}
                </div>
            </nav>

            <section className="max-w-4xl mx-auto text-center py-32 px-6">
                <h2 className="text-5xl font-bold text-white mb-6">
                    Build Your SaaS in Record Time
                </h2>
                <p className="text-xl text-gray-400 mb-12">
                    A production-ready Remix template with authentication, payments, and more.
                </p>
                <div className="flex gap-4 justify-center">
                    <SignUpButton mode="modal">
                        <button className="px-8 py-4 rounded-lg bg-primary hover:bg-primary/90 text-lg font-semibold text-white">
                            Start Free Trial
                        </button>
                    </SignUpButton>
                    <Link
                        to="#pricing"
                        className="px-8 py-4 rounded-lg border border-white/20 hover:bg-white/10 text-lg text-white"
                    >
                        View Pricing
                    </Link>
                </div>
            </section>
        </main>
    )
}
