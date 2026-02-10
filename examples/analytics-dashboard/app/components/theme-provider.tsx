/**
 * @fileoverview Theme Provider module
 * @module components/theme-provider
 */

'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

/**
 * Error handler for theme-provider
 * @param {Error} error - Error to handle
 */
function handleThemeproviderError(error) {
  try {
    console.error('[theme-provider]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
