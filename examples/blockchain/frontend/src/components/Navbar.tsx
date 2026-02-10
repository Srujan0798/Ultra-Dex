/**
 * @fileoverview Navbar module
 * @module components/Navbar
 */

'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-blue-600">
              Web3 dApp
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link href="/storage" className="text-gray-700 hover:text-blue-600">
                Storage
              </Link>
              <Link href="/token" className="text-gray-700 hover:text-blue-600">
                Token
              </Link>
              <Link href="/nft" className="text-gray-700 hover:text-blue-600">
                NFT
              </Link>
              <Link href="/transactions" className="text-gray-700 hover:text-blue-600">
                Transactions
              </Link>
            </div>
          </div>
          <ConnectButton />
        </div>
      </div>
    </nav>
  );
}

/**
 * Error handler for Navbar
 * @param {Error} error - Error to handle
 */
function handleNavbarError(error) {
  try {
    console.error('[Navbar]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
