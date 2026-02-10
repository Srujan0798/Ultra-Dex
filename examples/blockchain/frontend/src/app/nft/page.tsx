/**
 * @fileoverview Page module
 * @module nft/page
 */

'use client';

import { useState } from 'react';
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { MyNFTABI } from '@/config/abis';
import contracts from '@/config/contracts.json';
import { Image, Plus, RefreshCw, Package } from 'lucide-react';
import { formatEther } from 'viem';

export default function NFTPage() {
  const { address, isConnected } = useAccount();
  const [mintUri, setMintUri] = useState('');

  const contractAddress = contracts.contracts.MyNFT as `0x${string}`;

  const { data: balance, refetch: refetchBalance } = useContractRead({
    address: contractAddress,
    abi: MyNFTABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const { data: totalMinted } = useContractRead({
    address: contractAddress,
    abi: MyNFTABI,
    functionName: 'totalMinted',
  });

  const { data: mintPrice } = useContractRead({
    address: contractAddress,
    abi: MyNFTABI,
    functionName: 'mintPrice',
  });

  const { data: maxSupply } = useContractRead({
    address: contractAddress,
    abi: MyNFTABI,
    functionName: 'maxSupply',
  });

  const { data: mintingEnabled } = useContractRead({
    address: contractAddress,
    abi: MyNFTABI,
    functionName: 'mintingEnabled',
  });

  const { data: userTokens } = useContractRead({
    address: contractAddress,
    abi: MyNFTABI,
    functionName: 'tokensOfOwner',
    args: address ? [address] : undefined,
  });

  const { write: mint, data: mintData } = useContractWrite({
    address: contractAddress,
    abi: MyNFTABI,
    functionName: 'mint',
    value: mintPrice || BigInt(0),
  });

  const { isLoading: isMintLoading } = useWaitForTransaction({
    hash: mintData?.hash,
    onSuccess: () => {
      refetchBalance();
      setMintUri('');
    },
  });

  const handleMint = () => {
    if (mintUri) {
      mint({ args: [mintUri] });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-8">
        <Image className="w-8 h-8 text-purple-600 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900">NFT Collection</h1>
      </div>

      {!isConnected ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">
            Please connect your wallet to interact with the NFT contract.
          </p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Your NFTs</h3>
              <p className="text-2xl font-bold text-purple-600">{balance?.toString() || '0'}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total Minted</h3>
              <p className="text-2xl font-bold text-blue-600">{totalMinted?.toString() || '0'}</p>
              <p className="text-sm text-gray-500">/ {maxSupply?.toString() || '0'}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Mint Price</h3>
              <p className="text-2xl font-bold text-green-600">
                {mintPrice ? formatEther(mintPrice) : '0'} ETH
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
              <p
                className={`text-2xl font-bold ${mintingEnabled ? 'text-green-600' : 'text-red-600'}`}
              >
                {mintingEnabled ? 'Active' : 'Paused'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Plus className="w-5 h-5 mr-2" />
              Mint New NFT
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Metadata URI</label>
                <input
                  type="text"
                  value={mintUri}
                  onChange={(e) => setMintUri(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="ipfs://... or https://..."
                />
                <p className="text-sm text-gray-500 mt-1">
                  Enter the URI pointing to your NFT metadata JSON
                </p>
              </div>
              <button
                onClick={handleMint}
                disabled={!mintUri || isMintLoading || !mintingEnabled}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isMintLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Plus className="w-5 h-5 mr-2" />
                )}
                Mint NFT ({mintPrice ? formatEther(mintPrice) : '0'} ETH)
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Your Collection
            </h2>
            {userTokens && userTokens.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {userTokens.map((tokenId) => (
                  <div key={tokenId.toString()} className="border rounded-lg p-4 text-center">
                    <div className="w-full aspect-square bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg mb-3 flex items-center justify-center">
                      <span className="text-4xl font-bold text-white">#{tokenId.toString()}</span>
                    </div>
                    <p className="font-medium text-gray-900">Token #{tokenId.toString()}</p>
                    <p className="text-sm text-gray-500">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                You don't own any NFTs yet. Mint your first one above!
              </p>
            )}
          </div>
        </>
      )}
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
