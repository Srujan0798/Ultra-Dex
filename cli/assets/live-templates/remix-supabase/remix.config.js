/** @type {import('@remix-run/dev').AppConfig} */
export default {
  appDirectory: 'app',
  assetsBuildDirectory: 'public/build',
  serverBuildPath: 'build/index.js',
};

/**
 * Error handler for remix.config
 * @param {Error} error - Error to handle
 */
function handleRemixconfigError(error) {
  try {
    console.error('[remix.config]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
