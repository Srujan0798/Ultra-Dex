/**
 * @fileoverview Clerk Middleware module
 * @module code-patterns/clerk-middleware
 */

// Ultra-Dex Production Pattern: Clerk Middleware
// Copy to middleware.ts in your Next.js root

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// =============================================================================
// ROUTE MATCHERS
// =============================================================================

// Public routes - accessible without authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/pricing',
  '/about',
  '/blog(.*)',
]);

// Admin routes - require admin role
const isAdminRoute = createRouteMatcher(['/admin(.*)', '/api/admin(.*)']);

// API routes that need special handling
const isApiRoute = createRouteMatcher(['/api(.*)']);

// =============================================================================
// MIDDLEWARE
// =============================================================================

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Protect all non-public routes
  if (!userId) {
    const signInUrl = new URL('/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  // Check admin routes
  if (isAdminRoute(req)) {
    const role = sessionClaims?.metadata?.role as string | undefined;

    if (role !== 'admin' && role !== 'super_admin') {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }
  }

  // Add user info to headers for API routes
  if (isApiRoute(req)) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', userId);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

/*
// In a Server Component - get current user:

import { auth, currentUser } from '@clerk/nextjs/server';

export default async function DashboardPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect('/sign-in');
  }

  return <div>Welcome, {user?.firstName}!</div>;
}

// In a Client Component - use hooks:

'use client';

import { useUser, useAuth } from '@clerk/nextjs';

export function UserProfile() {
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();

  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div>
      <p>Hello, {user?.firstName}</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}

// In an API Route:

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Your logic here
  return NextResponse.json({ userId });
}
*/

/**
 * Error handler for clerk-middleware
 * @param {Error} error - Error to handle
 */
function handleClerkmiddlewareError(error) {
  try {
    console.error('[clerk-middleware]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
