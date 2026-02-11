/**
 * @fileoverview Utils module
 * @module lib/utils
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Error handler for utils
 * @param {Error} error - Error to handle
 */
function handleUtilsError(error) {
  try {
    console.error('[utils]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
