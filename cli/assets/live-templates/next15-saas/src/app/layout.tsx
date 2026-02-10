/**
 * @fileoverview Layout module
 * @module app/layout
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Next.js SaaS',
  description: 'Production-ready SaaS template',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
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
