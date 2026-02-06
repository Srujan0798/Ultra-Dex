// Copyright (c) 2026 Ultra-Dex

import React from 'react';
import { Text } from 'ink';
import { Box } from 'ink';

const Shimmer = ({ width = 20, height = 1, children, isActive = true }) => {
  if (!isActive) {
    return children || <Box width={width} height={height} />;
  }

  const shimmerLine = (lineWidth = width) => {
    const shimmer = '░▓▒'.repeat(Math.ceil(lineWidth / 3)).substring(0, lineWidth);
    return <Text>{shimmer}</Text>;
  };

  const lines = [];
  for (let i = 0; i < height; i++) {
    lines.push(<div key={i}>{shimmerLine()}</div>);
  }

  return <Box>{lines}</Box>;
};

export default Shimmer;
