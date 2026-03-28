// Copyright (c) 2026 Ultra-Dex

let stripAnsi = (value) => String(value ?? '');

try {
  const mod = await import('strip-ansi');
  stripAnsi = mod.default ?? mod;
} catch {
  stripAnsi = (value) => String(value ?? '');
}

export default stripAnsi;
