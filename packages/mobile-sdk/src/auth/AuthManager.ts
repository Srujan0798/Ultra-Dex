// Copyright (c) 2026 Ultra-Dex
// packages/mobile-sdk/src/auth/AuthManager.ts

import { AuthConfig } from '../types';
import Biometrics from '@react-native-community/biometrics';

export class AuthManager {
  private config: AuthConfig;
  private isInitialized = false;
  private biometricsAvailable = false;

  constructor(config: AuthConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    if (this.config.enableBiometrics) {
      try {
        const biometryType = await Biometrics.getBiometryType();
        this.biometricsAvailable = biometryType !== Biometrics.BiometryTypes.None;
      } catch (error) {
        console.warn('Biometrics not available:', error);
        this.biometricsAvailable = false;
      }
    }

    this.isInitialized = true;
  }

  async shutdown(): Promise<void> {
    this.isInitialized = false;
  }

  async authenticate(): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('AuthManager not initialized');
    }

    if (this.config.enableBiometrics && this.biometricsAvailable) {
      try {
        const result = await Biometrics.simplePrompt({
          promptMessage: this.config.biometricPrompt || 'Authenticate to access Ultra-Dex',
        });

        if (result.success) {
          return true;
        }
      } catch (error) {
        console.error('Biometric authentication failed:', error);
      }
    }

    // Fallback to API key authentication
    return this.validateApiKey();
  }

  async isAuthenticated(): Promise<boolean> {
    if (!this.isInitialized) {
      return false;
    }

    // For now, just check if we have an API key
    // In a real implementation, this would validate the token/session
    return !!this.config.apiKey;
  }

  private validateApiKey(): boolean {
    return !!this.config.apiKey && this.config.apiKey.length > 0;
  }

  getConfig(): AuthConfig {
    return { ...this.config };
  }

  updateConfig(newConfig: Partial<AuthConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  isBiometricsAvailable(): boolean {
    return this.biometricsAvailable;
  }
}
