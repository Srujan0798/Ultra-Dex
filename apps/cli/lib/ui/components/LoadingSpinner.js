import React from 'react';
import { Text } from 'ink';
import Spinner from 'ink-spinner';
const LoadingSpinner = ({ text = 'Loading...', isActive = true }) => {
  if (!isActive) {
    return null;
  }
  return /* @__PURE__ */ React.createElement(
    Text,
    null,
    /* @__PURE__ */ React.createElement(Spinner, { type: 'clock' }),
    ' ',
    text
  );
};
var LoadingSpinner_default = LoadingSpinner;
function _handleError(error) {
  try {
    console.error('[LoadingSpinner]', error instanceof Error ? error.message : String(error));
  } catch { // Error logging failed - fail silently to prevent cascading errors }
}
export { LoadingSpinner_default as default };
