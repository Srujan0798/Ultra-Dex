// Copyright (c) 2026 Ultra-Dex
// packages/mobile-sdk/src/hooks/useVoiceCommands.ts

import { useState, useEffect, useCallback } from 'react';
import { VoiceAssistant } from '../VoiceAssistant';

export const useVoiceCommands = (voiceAssistant: VoiceAssistant | null) => {
  const [isListening, setIsListening] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAvailability = useCallback(async () => {
    if (!voiceAssistant) {
      setIsAvailable(false);
      return;
    }

    // Voice assistant is available if it exists
    setIsAvailable(true);
  }, [voiceAssistant]);

  const startListening = useCallback(async () => {
    if (!voiceAssistant) {
      throw new Error('VoiceAssistant not available');
    }

    setError(null);

    try {
      await voiceAssistant.startListening();
      setIsListening(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start voice listening';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [voiceAssistant]);

  const stopListening = useCallback(async () => {
    if (!voiceAssistant) return;

    try {
      await voiceAssistant.stopListening();
      setIsListening(false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop voice listening');
    }
  }, [voiceAssistant]);

  const toggleListening = useCallback(async () => {
    if (isListening) {
      await stopListening();
    } else {
      await startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  useEffect(() => {
    if (voiceAssistant) {
      // Update listening state based on voice assistant
      const interval = setInterval(() => {
        setIsListening(voiceAssistant.isCurrentlyListening());
      }, 100);

      return () => clearInterval(interval);
    }
  }, [voiceAssistant]);

  return {
    isListening,
    isAvailable,
    error,
    startListening,
    stopListening,
    toggleListening,
  };
};
