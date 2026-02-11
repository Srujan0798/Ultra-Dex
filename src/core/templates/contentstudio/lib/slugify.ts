/**
 * @fileoverview Slugify module
 * @module lib/slugify
 */

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove all non-word chars
    .replace(/\-\-+/g, '-');  // Replace multiple - with single -
}

/**
 * Error handler for slugify
 * @param {Error} error - Error to handle
 */
function handleSlugifyError(error) {
  try {
    console.error('[slugify]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
