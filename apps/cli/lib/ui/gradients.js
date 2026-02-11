// Copyright (c) 2026 Ultra-Dex

import gradient from 'gradient-string';

/**
 * Gradient Text Rendering Engine
 */
export const gradients = {
  doomsday: gradient(['#dc2626', '#7c3aed', '#f59e0b']), // Red to Purple to Gold
  cyberpunk: gradient(['#00ff9f', '#00b8ff', '#001eff', '#bd00ff', '#d600ff']),
  corporate: gradient(['#3b82f6', '#1e40af']),
  success: gradient(['#10b981', '#059669']),
  warning: gradient(['#f59e0b', '#d97706']),
  error: gradient(['#ef4444', '#b91c1c']),
};

export function renderGradient(text, type = 'doomsday') {
  const g = gradients[type] || gradients.doomsday;
  return g(text);
}