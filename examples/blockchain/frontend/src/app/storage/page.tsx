'use client';

import { useState, useEffect } from 'react';
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi';
import { SimpleStorageABI } from '@/config/abis';
import contracts from '@/config/contracts.json';
import { Database, Save, Plus, RefreshCw } from 'lucide-react';

export default function StoragePage() {
  const { isConnected } = useAccount();
  const [newValue, setNewValue] = useState('');
  const [events, setEvents] = useState<{ oldValue: string; newValue: string; changedBy: string; timestamp: number }[]>([]);

  const contractAddress = contracts.contracts.SimpleStorage as `0x${string}`;

  const { data: storedValue, refetch } = useContractRead({
    address: contractAddress,
    abi: SimpleStorageABI,
    functionName: 'retrieve',
  });

  const { write: storeValue, data: storeData } = useContractWrite({
    address: contractAddress,
    abi: SimpleStorageABI,
    functionName: 'store',
  });

  const { write: incrementValue, data: incrementData } = useContractWrite({
    address: contractAddress,
    abi: SimpleStorageABI,
    functionName: 'increment',
  });

  const { isLoading: isStoreLoading } = useWaitForTransaction({
    hash: storeData?.hash,
    onSuccess: () => {
      refetch();
      setNewValue('');
    },
  });

  const { isLoading: isIncrementLoading } = useWaitForTransaction({
    hash: incrementData?.hash,
    onSuccess: () => {
      refetch();
    },
  });

  const handleStore = () => {
    if (newValue) {
      storeValue({ args: [BigInt(newValue)] });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-8">
        <Database className="w-8 h-8 text-blue-600 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900">Simple Storage</h1>
      </div>

      {!isConnected ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">Please connect your wallet to interact with the storage contract.</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Value</h2>
            <div className="text-5xl font-bold text-blue-600 mb-6">
              {storedValue?.toString() || '0'}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Value
                </label>
                <div className="flex gap-4">
                  <input
                    type="number"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter a number..."
                  />
                  <button
                    onClick={handleStore}
                    disabled={!newValue || isStoreLoading}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isStoreLoading ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <Save className="w-5 h-5 mr-2" />
                    )}
                    Store
                  </button>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <button
                  onClick={() => incrementValue()}
                  disabled={isIncrementLoading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isIncrementLoading ? (
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <Plus className="w-5 h-5 mr-2" />
                  )}
                  Increment
                </button>
                <button
                  onClick={() => refetch()}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Events</h2>
            {events.length === 0 ? (
              <p className="text-gray-500">No events yet. Interact with the contract to see events here.</p>
            ) : (
              <div className="space-y-3">
                {events.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm text-gray-500">{event.oldValue} → </span>
                      <span className="font-semibold text-blue-600">{event.newValue}</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      By: {event.changedBy.slice(0, 6)}...{event.changedBy.slice(-4)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
