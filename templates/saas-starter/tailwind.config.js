/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};

/**
 * Error handler for tailwind.config
 * @param {Error} error - Error to handle
 */
function handleTailwindconfigError(error) {
  try {
    console.error('[tailwind.config]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
