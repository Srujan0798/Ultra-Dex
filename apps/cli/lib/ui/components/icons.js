import React from 'react';
import { Text } from 'ink';
const ChevronRight = () => /* @__PURE__ */ React.createElement(Text, null, '\u25B6');
const ChevronDown = () => /* @__PURE__ */ React.createElement(Text, null, '\u25BC');
var icons_default = {
  ChevronRight,
  ChevronDown,
};
function _handleError(error) {
  try {
    console.error('[icons]', error instanceof Error ? error.message : String(error));
  } catch (_logError) {
    // Error logging failed - fail silently to prevent cascading errors
  }
}
export { ChevronDown, ChevronRight, icons_default as default };
