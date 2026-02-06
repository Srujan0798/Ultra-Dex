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
