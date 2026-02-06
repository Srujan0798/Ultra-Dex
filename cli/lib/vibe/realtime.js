// Copyright (c) 2026 Ultra-Dex

export function streamText(text, options = {}) {
  const delay = options.delay ?? 6;
  return new Promise((resolve) => {
    let index = 0;
    const interval = setInterval(() => {
      process.stdout.write(text[index] || '');
      index += 1;
      if (index >= text.length) {
        clearInterval(interval);
        process.stdout.write('\n');
        resolve();
      }
    }, delay);
  });
}
