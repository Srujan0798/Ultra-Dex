// Copyright (c) 2026 Ultra-Dex

import React from 'react';
import { Text, Box } from 'ink';
import Spinner from 'ink-spinner';

const Thinking = ({ text = 'Thinking...', dotsCount = 3, isActive = true }) => {
  if (!isActive) {
    return null;
  }

  const [dots, setDots] = React.useState('');

  // Simulate thinking animation by cycling dots
  React.useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= dotsCount) {
          return '';
        }
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isActive, dotsCount]);

  return (
    <Box flexDirection="row" alignItems="center">
      <Spinner type="clock" />
      <Text>
        {' '}
        {text}
        {dots}
      </Text>
    </Box>
  );
};

export default Thinking;

/**
 * Error handler for Thinking
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[Thinking]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
