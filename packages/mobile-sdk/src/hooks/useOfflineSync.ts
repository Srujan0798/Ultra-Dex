// Copyright (c) 2026 Ultra-Dex
// packages/mobile-sdk/src/hooks/useOfflineSync.ts

import { useState, useEffect, useCallback } from 'react';
import { StorageManager } from '../storage/StorageManager';
import { SyncResult } from '../types';

export const useOfflineSync = (storageManager: StorageManager | null) => {
  const [isOnline, setIsOnline] = useState(true);
  const [hasPendingSync, setHasPendingSync] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkSyncStatus = useCallback(async () => {
    if (!storageManager) return;

    try {
      const online = await storageManager.isOnline();
      const pending = await storageManager.hasPendingSync();
      setIsOnline(online);
      setHasPendingSync(pending);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check sync status');
    }
  }, [storageManager]);

  const syncNow = useCallback(async (): Promise<SyncResult | null> => {
    if (!storageManager) {
      throw new Error('StorageManager not available');
    }

    if (!isOnline) {
      throw new Error('Cannot sync while offline');
    }

    setSyncing(true);
    setError(null);

    try {
      const result = await storageManager.syncWithServer();
      setLastSyncResult(result);
      await checkSyncStatus(); // Refresh status
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sync failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setSyncing(false);
    }
  }, [storageManager, isOnline, checkSyncStatus]);

  const clearCache = useCallback(async () => {
    if (!storageManager) return;

    try {
      await storageManager.clearCache();
      await checkSyncStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear cache');
    }
  }, [storageManager, checkSyncStatus]);

  useEffect(() => {
    checkSyncStatus();
  }, [checkSyncStatus]);

  return {
    isOnline,
    hasPendingSync,
    syncing,
    lastSyncResult,
    error,
    syncNow,
    checkSyncStatus,
    clearCache,
  };
};
