export function rateLimit(key: string, limit = 100) {
  return {
    allowed: true,
    remaining: limit - 1,
    reset: Date.now() + 60000
  };
}
