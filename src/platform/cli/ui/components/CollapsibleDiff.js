import React, { useState } from "react";
import { Box, Text, Static } from "ink";
import { ChevronRight, ChevronDown } from "./icons.js";
const CollapsibleDiff = ({ title, diffContent, initiallyExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column" }, /* @__PURE__ */ React.createElement(Box, { onClick: toggleExpand, flexDirection: "row", alignItems: "center" }, isExpanded ? /* @__PURE__ */ React.createElement(ChevronDown, null) : /* @__PURE__ */ React.createElement(ChevronRight, null), /* @__PURE__ */ React.createElement(Text, { bold: true, onClick: toggleExpand }, title)), isExpanded && /* @__PURE__ */ React.createElement(Box, { marginLeft: 2, flexDirection: "column" }, /* @__PURE__ */ React.createElement(Box, { borderStyle: "round", borderColor: "blue", padding: 1 }, /* @__PURE__ */ React.createElement(Static, { items: diffContent.split("\n") }, (line, index) => /* @__PURE__ */ React.createElement(Box, { key: index }, line.startsWith("+") ? /* @__PURE__ */ React.createElement(Text, { color: "green" }, line) : line.startsWith("-") ? /* @__PURE__ */ React.createElement(Text, { color: "red" }, line) : /* @__PURE__ */ React.createElement(Text, null, line))))));
};
var CollapsibleDiff_default = CollapsibleDiff;
function handleError(error) {
  try {
    logger.error("[CollapsibleDiff]", error instanceof Error ? error.message : String(error));
  } catch (_) {
  }
}
export {
  CollapsibleDiff_default as default
};
