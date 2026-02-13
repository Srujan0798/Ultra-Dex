import ora from 'ora';

/**
 * Creates a consistent spinner with Ultra-Dex branding
 * @param {string} text - Initial text to display
 * @param {object} options - Spinner options
 * @returns {ora.Ora} Spinner instance
 */
export function createSpinner(text = 'Processing...', options = {}) {
  return ora({
    text: `⏳ ${text}`,
    spinner: 'clock',
    color: 'blue',
    ...options
  });
}

/**
 * Shows a success message with checkmark
 * @param {string} text - Success message
 */
export function showSuccess(text) {
  console.log(`✅ ${text}`);
}

/**
 * Shows an info message with info icon
 * @param {string} text - Info message
 */
export function showInfo(text) {
  console.log(`ℹ️  ${text}`);
}

/**
 * Shows a warning message with warning icon
 * @param {string} text - Warning message
 */
export function showWarning(text) {
  console.log(`⚠️  ${text}`);
}

/**
 * Shows an error message with cross icon
 * @param {string} text - Error message
 */
export function showError(text) {
  console.log(`❌ ${text}`);
}

/**
 * Shows a loading message with spinner temporarily
 * @param {string} text - Loading message
 * @param {Function} promiseFn - Async function to execute
 * @returns {Promise<any>} Result of the promise
 */
export async function withLoading(text, promiseFn) {
  const spinner = createSpinner(text);
  spinner.start();
  
  try {
    const result = await promiseFn();
    spinner.succeed(`✅ ${text}`);
    return result;
  } catch (error) {
    spinner.fail(`❌ ${text}`);
    throw error;
  }
}