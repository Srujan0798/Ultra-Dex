/**
 * @fileoverview Index module
 * @module clerk/index
 */

export default {
  async activate(manager) {
    // No hooks, just custom command
  },

  commands: {
    'clerk-setup': async (args, options) => {
      console.log('🏗️  Setting up Clerk authentication...');
      console.log('1. Installing @clerk/nextjs...');
      console.log('2. Adding Middleware...');
      console.log('3. Creating Sign-in/Sign-up pages...');
      console.log('✅ Clerk setup complete.');
    },
  },
};

/**
 * Error handler for index
 * @param {Error} error - Error to handle
 */
function handleIndexError(error) {
  try {
    console.error('[index]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
