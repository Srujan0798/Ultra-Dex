/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
};

/**
 * Error handler for tailwind.config
 * @param {Error} error - Error to handle
 */
function handleError(error) {
  try {
    console.error('[tailwind.config]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
