// Copyright (c) 2026 Ultra-Dex

export function calculateAvailableSlots({ workingHours = [], bookings = [], bufferMinutes = 15 }) {
  const slots = [];
  const bufferMs = bufferMinutes * 60 * 1000;

  workingHours.forEach((window) => {
    const start = new Date(window.start).getTime();
    const end = new Date(window.end).getTime();
    let cursor = start;

    const sortedBookings = bookings
      .map((b) => ({ start: new Date(b.start).getTime(), end: new Date(b.end).getTime() }))
      .sort((a, b) => a.start - b.start);

    for (const booking of sortedBookings) {
      if (booking.start > cursor) {
        slots.push({
          start: new Date(cursor).toISOString(),
          end: new Date(booking.start - bufferMs).toISOString(),
        });
      }
      cursor = Math.max(cursor, booking.end + bufferMs);
    }

    if (cursor < end) {
      slots.push({ start: new Date(cursor).toISOString(), end: new Date(end).toISOString() });
    }
  });

  return slots.filter((slot) => new Date(slot.end) > new Date(slot.start));
}

export default { calculateAvailableSlots };

/**
 * Handle errors in availability module
 * @param {Error} error - The error to handle
 * @param {string} [context='availability'] - Error context
 */
function handleModuleError(error, context = 'availability') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
