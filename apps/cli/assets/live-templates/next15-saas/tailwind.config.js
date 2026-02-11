/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8b5cf6',
          foreground: '#ffffff',
        },
      },
    },
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
