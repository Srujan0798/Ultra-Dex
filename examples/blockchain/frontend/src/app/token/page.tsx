/**
 * @fileoverview Page module
 * @module token/page
 */

'use client';

import { useState, useEffect } from 'react';
import {
  useAccount,
  useBalance,
  useContractRead,
  useContractWrite,
  useWaitForTransaction,
} from 'wagmi';
import { MyTokenABI } from '@/config/abis';
import contracts from '@/config/contracts.json';
import { Coins, Send, Flame, Plus, RefreshCw } from 'lucide-react';
import { formatEther, parseEther } from 'viem';

export default function TokenPage() {
  const { address, isConnected } = useAccount();
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [burnAmount, setBurnAmount] = useState('');

  const contractAddress = contracts.contracts.MyToken as `0x${string}`;

  const { data: tokenBalance, refetch: refetchBalance } = useContractRead({
    address: contractAddress,
    abi: MyTokenABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  });

  const { data: totalSupply } = useContractRead({
    address: contractAddress,
    abi: MyTokenABI,
    functionName: 'totalSupply',
  });

  const { data: tokenName } = useContractRead({
    address: contractAddress,
    abi: MyTokenABI,
    functionName: 'name',
  });

  const { data: tokenSymbol } = useContractRead({
    address: contractAddress,
    abi: MyTokenABI,
    functionName: 'symbol',
  });

  const { write: transfer, data: transferData } = useContractWrite({
    address: contractAddress,
    abi: MyTokenABI,
    functionName: 'transfer',
  });

  const { write: burn, data: burnData } = useContractWrite({
    address: contractAddress,
    abi: MyTokenABI,
    functionName: 'burn',
  });

  const { isLoading: isTransferLoading } = useWaitForTransaction({
    hash: transferData?.hash,
    onSuccess: () => {
      refetchBalance();
      setTransferTo('');
      setTransferAmount('');
    },
  });

  const { isLoading: isBurnLoading } = useWaitForTransaction({
    hash: burnData?.hash,
    onSuccess: () => {
      refetchBalance();
      setBurnAmount('');
    },
  });

  const handleTransfer = () => {
    if (transferTo && transferAmount) {
      transfer({ args: [transferTo as `0x${string}`, parseEther(transferAmount)] });
    }
  };

  const handleBurn = () => {
    if (burnAmount) {
      burn({ args: [parseEther(burnAmount)] });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-8">
        <Coins className="w-8 h-8 text-green-600 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900">ERC20 Token</h1>
      </div>

      {!isConnected ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">Please connect your wallet to interact with the token.</p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Token</h3>
              <p className="text-2xl font-bold text-gray-900">{tokenName || 'MyToken'}</p>
              <p className="text-sm text-gray-500">{tokenSymbol || 'MTK'}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Your Balance</h3>
              <p className="text-2xl font-bold text-green-600">
                {tokenBalance ? formatEther(tokenBalance) : '0'}
              </p>
              <p className="text-sm text-gray-500">{tokenSymbol || 'MTK'}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total Supply</h3>
              <p className="text-2xl font-bold text-blue-600">
                {totalSupply ? formatEther(totalSupply) : '0'}
              </p>
              <p className="text-sm text-gray-500">{tokenSymbol || 'MTK'}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Send className="w-5 h-5 mr-2" />
                Transfer Tokens
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0x..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="0.0"
                    step="0.001"
                  />
                </div>
                <button
                  onClick={handleTransfer}
                  disabled={!transferTo || !transferAmount || isTransferLoading}
                  className="w-full px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isTransferLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Send className="w-5 h-5 mr-2" />
                  )}
                  Transfer
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Flame className="w-5 h-5 mr-2" />
                Burn Tokens
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount to Burn
                  </label>
                  <input
                    type="number"
                    value={burnAmount}
                    onChange={(e) => setBurnAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="0.0"
                    step="0.001"
                  />
                </div>
                <button
                  onClick={handleBurn}
                  disabled={!burnAmount || isBurnLoading}
                  className="w-full px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isBurnLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Flame className="w-5 h-5 mr-2" />
                  )}
                  Burn
                </button>
              </div>
            </div>
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
