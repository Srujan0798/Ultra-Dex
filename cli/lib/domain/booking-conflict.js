// Copyright (c) 2026 Ultra-Dex

export function hasConflict(bookings, candidate) {
  const start = new Date(candidate.startTime).getTime();
  const end = new Date(candidate.endTime).getTime();

  return bookings.some((booking) => {
    const bStart = new Date(booking.startTime).getTime();
    const bEnd = new Date(booking.endTime).getTime();
    return bStart < end && bEnd > start;
  });
}

export function applyBusinessRules(candidate, rules = {}) {
  const now = Date.now();
  const start = new Date(candidate.startTime).getTime();
  const durationMs = new Date(candidate.endTime).getTime() - start;

  if (rules.minNoticeHours) {
    const minNoticeMs = rules.minNoticeHours * 60 * 60 * 1000;
    if (start - now < minNoticeMs) {
      throw new Error('Minimum notice rule violated');
    }
  }

  if (rules.maxDurationHours) {
    const maxDurationMs = rules.maxDurationHours * 60 * 60 * 1000;
    if (durationMs > maxDurationMs) {
      throw new Error('Max duration rule violated');
    }
  }
}

export default { hasConflict, applyBusinessRules };
