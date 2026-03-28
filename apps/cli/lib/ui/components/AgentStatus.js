import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

/**
 * A component that displays a status indicator with a specialized spinner.
 * @param {Object} props
 * @param {string} props.type - The type of agent status ('thinking' or 'building').
 * @param {string} [props.text] - Optional text to display next to the spinner.
 */
const AgentStatus = ({ type = 'thinking', text }) => {
  let emoji = '';
  let spinnerType = 'dots';
  let color = 'cyan';
  let defaultText = '';

  if (type === 'thinking') {
    emoji = '🧠 ';
    spinnerType = 'dots';
    color = 'yellow';
    defaultText = 'Thinking...';
  } else if (type === 'building') {
    emoji = '🔨 ';
    spinnerType = 'hamburger';
    color = 'green';
    defaultText = 'Building...';
  }

  const displayText = text || defaultText;

  return /* @__PURE__ */ React.createElement(Box, { flexDirection: "row", alignItems: "center" }, /* @__PURE__ */ React.createElement(Text, { color: color }, emoji, /* @__PURE__ */ React.createElement(Spinner, { type: spinnerType }), " ", displayText));
};

var AgentStatus_default = AgentStatus;

export {
  AgentStatus_default as default
};
