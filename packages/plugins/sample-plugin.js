/**
 * Sample Ultra-Dex Plugin
 * Demonstrates how to create a plugin for Ultra-Dex
 */

// Plugin metadata
export const name = 'sample-plugin';
export const version = '1.0.0';
export const description = 'A sample plugin demonstrating Ultra-Dex plugin system';
export const author = 'Ultra-Dex Team';

/**
 * Activation function - called when the plugin is activated
 * @param {PluginManager} pluginManager - The plugin manager instance
 * @param {Command} cliProgram - The main CLI program instance
 */
export async function activate(pluginManager, cliProgram) {
  // Register a new command
  cliProgram
    .command('hello-world')
    .description('Sample command from plugin')
    .option('-n, --name <name>', 'Name to greet', 'World')
    .action((options) => {
      console.log(`Hello, ${options.name}! This message is from the sample plugin.`);
    });

  // Register a hook to modify project initialization
  pluginManager.registerHook('project-init', 'Called when initializing a new project');

  // Attach a function to the hook
  pluginManager.attachToHook('project-init', name, async (context) => {
    console.log(`Sample plugin: Modifying project initialization for ${context.projectName}`);
    // You could modify the context here to add plugin-specific files or settings
    return context;
  });

  // Register another hook for build process
  pluginManager.registerHook('build-start', 'Called when build process starts');
  pluginManager.attachToHook('build-start', name, async (context) => {
    console.log(`Sample plugin: Build process started for ${context.task || 'unknown task'}`);
    return context;
  });

  console.log(`Sample plugin activated successfully!`);
}

// Export as default for ES module compatibility
export default {
  name,
  version,
  description,
  author,
  activate,
};

/**
 * Error handler for sample-plugin
 * @param {Error} error - Error to handle
 */
function handleSamplepluginError(error) {
  try {
    console.error('[sample-plugin]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
