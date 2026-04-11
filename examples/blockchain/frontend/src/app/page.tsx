/**
 * @fileoverview Page module
 * @module app/page
 */

'use client';

import Link from 'next/link';
import { Database, Coins, Image, ArrowRight } from 'lucide-react';

export default function Home() {
  const features = [
    {
      title: 'Simple Storage',
      description: 'Store and retrieve values on the blockchain',
      icon: Database,
      href: '/storage',
      color: 'bg-blue-500',
    },
    {
      title: 'ERC20 Token',
      description: 'Mint, transfer, and burn tokens',
      icon: Coins,
      href: '/token',
      color: 'bg-green-500',
    },
    {
      title: 'NFT Collection',
      description: 'Mint and view your NFTs',
      icon: Image,
      href: '/nft',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Web3 dApp Template</h1>
        <p className="text-lg text-gray-600">
          A complete template for building decentralized applications with Hardhat, Next.js, and
          modern Web3 tools.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {features.map((feature) => (
          <Link
            key={feature.title}
            href={feature.href}
            className="group block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <div
              className={`${feature.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}
            >
              <feature.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
            <p className="text-gray-600 mb-4">{feature.description}</p>
            <div className="flex items-center text-blue-600 group-hover:text-blue-700">
              <span className="text-sm font-medium">Get Started</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Features</h2>
        <ul className="space-y-3 text-gray-600">
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>
              <strong>Smart Contracts:</strong> Solidity contracts with OpenZeppelin
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>
              <strong>Wallet Integration:</strong> RainbowKit + wagmi for multiple wallet support
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>
              <strong>TypeScript:</strong> Full type safety throughout the stack
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>
              <strong>Modern UI:</strong> Tailwind CSS for responsive design
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>
              <strong>Event Listening:</strong> Real-time blockchain event monitoring
            </span>
          </li>
          <li className="flex items-start">
            <span className="text-green-500 mr-2">✓</span>
            <span>
              <strong>Testing:</strong> Comprehensive test suite with Hardhat
            </span>
          </li>
        </ul>
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
