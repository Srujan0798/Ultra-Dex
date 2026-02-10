// Copyright (c) 2026 Ultra-Dex

import React from 'react';
import { Text } from 'ink';

export const ChevronRight = () => <Text>{'▶'}</Text>;
export const ChevronDown = () => <Text>{'▼'}</Text>;

export default {
  ChevronRight,
  ChevronDown,
};

/**
 * Error handler for icons
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[icons]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
