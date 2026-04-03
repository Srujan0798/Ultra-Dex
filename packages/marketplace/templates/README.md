# Ultra-Dex Plugin Development Guide

Welcome to Ultra-Dex plugin development! This guide will help you create plugins that extend Ultra-Dex's capabilities.

## Plugin Categories

Ultra-Dex supports the following plugin categories:

- **agents**: AI agents that can perform tasks autonomously
- **providers**: AI model providers and integrations
- **tools**: Utility tools and extensions
- **workflows**: Pre-built workflows and automation templates

## Plugin Structure

Every Ultra-Dex plugin consists of:

1. **Manifest file** (`ultra-dex-plugin.json`): Metadata about your plugin
2. **Main file** (`index.js` or `index.ts`): Plugin implementation
3. **Optional assets**: Additional files your plugin needs

### Manifest File

```json
{
  "name": "my-awesome-plugin",
  "version": "1.0.0",
  "description": "A brief description of what your plugin does",
  "main": "index.js",
  "author": "Your Name",
  "license": "MIT",
  "ultra-dex": {
    "category": "tool",
    "tags": ["utility", "automation"],
    "hooks": ["pre-init", "post-generate"],
    "commands": [
      {
        "name": "my-command",
        "description": "Custom command provided by this plugin"
      }
    ],
    "dependencies": {
      "ultra-dex": ">=3.0.0"
    }
  }
}
```

### Plugin Implementation

```javascript
export default {
  name: 'my-awesome-plugin',
  version: '1.0.0',
  description: 'Plugin description',

  async activate(pluginManager) {
    // Plugin activation logic
    console.log('Plugin activated!');

    // Register hooks
    pluginManager.registerHook('pre-init', async (context) => {
      // Pre-initialization logic
    });
  },

  async deactivate() {
    // Cleanup logic
    console.log('Plugin deactivated');
  },

  commands: {
    'my-command': {
      description: 'Command description',
      async execute(args, options) {
        // Command implementation
      },
    },
  },
};
```

## Available Hooks

Ultra-Dex provides several hooks your plugin can listen to:

- `pre-init`: Before Ultra-Dex initializes
- `post-init`: After Ultra-Dex initializes
- `pre-generate`: Before code generation
- `post-generate`: After code generation
- `pre-deploy`: Before deployment
- `post-deploy`: After deployment
- `command:*`: Custom command hooks

## Publishing to Marketplace

1. Create your plugin following the structure above
2. Test your plugin locally
3. Submit to the Ultra-Dex marketplace via the web interface or API
4. Your plugin will be reviewed and published

## Development Tools

- Use the plugin templates in this directory to get started
- Test your plugin with `ultra-dex plugin install ./path/to/your/plugin`
- Check plugin logs in the Ultra-Dex console

## Best Practices

1. **Error Handling**: Always wrap async operations in try-catch blocks
2. **Cleanup**: Implement proper cleanup in the `deactivate` method
3. **Documentation**: Document your plugin's capabilities and usage
4. **Versioning**: Follow semantic versioning
5. **Security**: Don't include sensitive data in your plugin code

## Example Plugins

Check the `packages/plugins/` directory for examples of real Ultra-Dex plugins.

## Support

For plugin development support:

- Visit the [Ultra-Dex documentation](https://docs.ultra-dex.ai)
- Join the community on [Discord/GitHub](https://github.com/Srujan0798/Ultra-Dex)
- Report issues on [GitHub Issues](https://github.com/Srujan0798/Ultra-Dex/issues)
