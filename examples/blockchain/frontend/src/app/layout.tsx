'use client';

import { Web3Provider } from '@/components/Web3Provider';
import { Navbar } from '@/components/Navbar';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Web3 dApp Template</title>
        <meta name="description" content="Complete Web3 dApp template" />
      </head>
      <body className="bg-gray-50 min-h-screen">
        <Web3Provider>
          <Navbar />
          <main className="container mx-auto px-4 py-8">{children}</main>
        </Web3Provider>
      </body>
    </html>
  );
}
