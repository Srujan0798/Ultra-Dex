import React from "react";
import { Text } from "ink";
import { Box } from "ink";
const Shimmer = ({ width = 20, height = 1, children, isActive = true }) => {
  if (!isActive) {
    return children || /* @__PURE__ */ React.createElement(Box, { width, height });
  }
  const shimmerLine = (lineWidth = width) => {
    const shimmer = "\u2591\u2593\u2592".repeat(Math.ceil(lineWidth / 3)).substring(0, lineWidth);
    return /* @__PURE__ */ React.createElement(Text, null, shimmer);
  };
  const lines = [];
  for (let i = 0; i < height; i++) {
    lines.push(/* @__PURE__ */ React.createElement("div", { key: i }, shimmerLine()));
  }
  return /* @__PURE__ */ React.createElement(Box, null, lines);
};
var Shimmer_default = Shimmer;
function handleError(error) {
  try {
    logger.error("[Shimmer]", error instanceof Error ? error.message : String(error));
  } catch (_) {
  }
}
export {
  Shimmer_default as default
};
