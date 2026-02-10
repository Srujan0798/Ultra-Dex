// Copyright (c) 2026 Ultra-Dex

import React from 'react';
import { Text } from 'ink';
import Spinner from 'ink-spinner';

const LoadingSpinner = ({ text = 'Loading...', isActive = true }) => {
  if (!isActive) {
    return null;
  }

  return (
    <Text>
      <Spinner type="clock" /> {text}
    </Text>
  );
};

export default LoadingSpinner;

/**
 * Error handler for LoadingSpinner
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[LoadingSpinner]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
