// Copyright (c) 2026 Ultra-Dex

export const goRuntime = {
  id: 'go',
  image: 'golang:1.22-alpine',
  run: (file) => `go run ${file}`,
};

export default goRuntime;
