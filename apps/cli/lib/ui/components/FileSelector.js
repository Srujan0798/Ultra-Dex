import React, { useState } from "react";
import { Box, Text } from "ink";
import ArrowMenu from "./ArrowMenu.js";
const FileSelector = ({ files, onSelect, title = "Select a file:" }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const handleSelect = (file, index) => {
    setSelectedFile(file);
    onSelect(file, index);
  };
  return /* @__PURE__ */ React.createElement(Box, { flexDirection: "column" }, /* @__PURE__ */ React.createElement(Text, { bold: true }, title), /* @__PURE__ */ React.createElement(ArrowMenu, { items: files, onSelect: handleSelect, initialIndex: 0 }), selectedFile && /* @__PURE__ */ React.createElement(Text, { color: "green" }, "Selected: ", selectedFile));
};
var FileSelector_default = FileSelector;
function _handleError(error) {
  try {
    console.error("[FileSelector]", error instanceof Error ? error.message : String(error));
  } catch (_) {
  }
}
export {
  FileSelector_default as default
};
