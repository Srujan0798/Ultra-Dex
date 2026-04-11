import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
const ArrowMenu = ({ items, onSelect, initialIndex = 0 }) => {
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : items.length - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prevIndex) => (prevIndex < items.length - 1 ? prevIndex + 1 : 0));
    } else if (input === '\r' || input === ' ') {
      onSelect(items[selectedIndex], selectedIndex);
    }
  });
  return /* @__PURE__ */ React.createElement(
    Box,
    { flexDirection: 'column' },
    items.map((item, index) =>
      /* @__PURE__ */ React.createElement(
        Box,
        { key: index, flexDirection: 'row' },
        /* @__PURE__ */ React.createElement(
          Text,
          { color: index === selectedIndex ? 'cyan' : 'white' },
          index === selectedIndex ? '> ' : '  ',
          typeof item === 'string' ? item : item.label || `Item ${index}`
        )
      )
    )
  );
};
var ArrowMenu_default = ArrowMenu;
function _handleError(error) {
  try {
    console.error('[ArrowMenu]', error instanceof Error ? error.message : String(error));
  } catch { // Error logging failed - fail silently to prevent cascading errors }
}
export { ArrowMenu_default as default };
