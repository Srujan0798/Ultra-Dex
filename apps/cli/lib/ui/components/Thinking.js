import React from 'react';
import { Text, Box } from 'ink';
import Spinner from 'ink-spinner';
const Thinking = ({ text = 'Thinking...', dotsCount = 3, isActive = true }) => {
  if (!isActive) {
    return null;
  }
  const [dots, setDots] = React.useState('');
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
  return /* @__PURE__ */ React.createElement(
    Box,
    { flexDirection: 'row', alignItems: 'center' },
    /* @__PURE__ */ React.createElement(Spinner, { type: 'clock' }),
    /* @__PURE__ */ React.createElement(Text, null, ' ', text, dots)
  );
};
var Thinking_default = Thinking;
function _handleError(error) {
  try {
    console.error('[Thinking]', error instanceof Error ? error.message : String(error));
  } catch (_) {}
}
export { Thinking_default as default };
