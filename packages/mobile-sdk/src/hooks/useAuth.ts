// Copyright (c) 2026 Ultra-Dex
// packages/mobile-sdk/src/hooks/useAuth.ts

import { useState, useEffect, useCallback } from 'react';
import { AuthManager } from '../auth/AuthManager';

export const useAuth = (authManager: AuthManager | null) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isBiometricsAvailable, setIsBiometricsAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuthStatus = useCallback(async () => {
    if (!authManager) {
      setLoading(false);
      return;
    }

    try {
      const authenticated = await authManager.isAuthenticated();
      const biometrics = authManager.isBiometricsAvailable();
      setIsAuthenticated(authenticated);
      setIsBiometricsAvailable(biometrics);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication check failed');
    } finally {
      setLoading(false);
    }
  }, [authManager]);

  const authenticate = useCallback(async () => {
    if (!authManager) {
      throw new Error('AuthManager not available');
    }

    setError(null);

    try {
      const success = await authManager.authenticate();
      setIsAuthenticated(success);
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [authManager]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return {
    isAuthenticated,
    isBiometricsAvailable,
    loading,
    error,
    authenticate,
    checkAuthStatus,
  };
};
