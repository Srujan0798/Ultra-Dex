import React from 'react';
import { Box, Text } from 'ink';
import gradient from 'gradient-string';

/**
 * A component that displays a text banner with a gradient effect.
 * @param {Object} props
 * @param {string} props.text - The text to display in the banner.
 * @param {string|string[]} [props.colors=['#00f2fe', '#4facfe']] - An array of colors for the gradient.
 * @param {boolean} [props.bold=true] - Whether the text should be bold.
 */
const GradientBanner = ({ text, colors = ['#00f2fe', '#4facfe'], bold = true }) => {
  if (!text) return null;

  const gradientText = gradient(colors).multiline(text);

  return /* @__PURE__ */ React.createElement(Box, { marginY: 1 }, /* @__PURE__ */ React.createElement(Text, { bold: bold }, gradientText));
};

var GradientBanner_default = GradientBanner;

export {
  GradientBanner_default as default
};
