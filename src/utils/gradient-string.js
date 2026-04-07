// Copyright (c) 2026 Ultra-Dex

function createIdentityGradient() {
  const formatter = (value) => value;
  formatter.multiline = (value) => value;
  return formatter;
}

let gradientFactory = () => createIdentityGradient();

try {
  const mod = await import('gradient-string');
  gradientFactory = mod.default ?? mod;
} catch {
  gradientFactory = () => createIdentityGradient();
}

export default gradientFactory;
