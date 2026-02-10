// Copyright (c) 2026 Ultra-Dex

import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';

const ArrowMenu = ({ items, onSelect, initialIndex = 0 }) => {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : items.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prevIndex) => (prevIndex < items.length - 1 ? prevIndex + 1 : 0));
    } else if (input === '\r' || input === ' ') {
      // Enter or Space
      onSelect(items[selectedIndex], selectedIndex);
    }
  });

  return (
    <Box flexDirection="column">
      {items.map((item, index) => (
        <Box key={index} flexDirection="row">
          <Text color={index === selectedIndex ? 'cyan' : 'white'}>
            {index === selectedIndex ? '> ' : '  '}
            {typeof item === 'string' ? item : item.label || `Item ${index}`}
          </Text>
        </Box>
      ))}
    </Box>
  );
};

export default ArrowMenu;

/**
 * Error handler for ArrowMenu
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[ArrowMenu]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
