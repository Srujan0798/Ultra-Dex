// Copyright (c) 2026 Ultra-Dex

const fallbackFigures = {
  gear: '*',
  info: 'i',
  warning: '!',
  cross: 'x',
  tick: '√',
  circle: 'o',
  bullet: '•',
  pointer: '>',
  play: '▶',
};

let figures = fallbackFigures;

try {
  const mod = await import('figures');
  figures = mod.default ?? mod;
} catch {
  figures = fallbackFigures;
}

export default figures;
