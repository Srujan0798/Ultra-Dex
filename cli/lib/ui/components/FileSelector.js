// Copyright (c) 2026 Ultra-Dex

import React, { useState } from 'react';
import { Box, Text } from 'ink';
import ArrowMenu from './ArrowMenu.js';

const FileSelector = ({ files, onSelect, title = 'Select a file:' }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  const handleSelect = (file, index) => {
    setSelectedFile(file);
    onSelect(file, index); // Pass the selected file to parent
  };

  return (
    <Box flexDirection="column">
      <Text bold>{title}</Text>
      <ArrowMenu items={files} onSelect={handleSelect} initialIndex={0} />
      {selectedFile && <Text color="green">Selected: {selectedFile}</Text>}
    </Box>
  );
};

export default FileSelector;
