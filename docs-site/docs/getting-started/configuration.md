# Configuration

Ultra-Dex can be configured in several ways to customize its behavior for your specific needs.

## Configuration File

Create a `.ultra-dexrc` file in your project root or home directory. This file should be in JSON format:

```json
{
  "aiProvider": "anthropic",
  "model": "claude-3-5-sonnet-20241022",
  "workspace": "./projects/my-app",
  "sandboxEnabled": true,
  "debugMode": false,
  "maxTokens": 4096,
  "temperature": 0.2,
  "plugins": [
    "ultra-dex-plugin-auth",
    "ultra-dex-plugin-db"
  ],
  "customAgents": [
    "./custom-agents/payment-agent.js"
  ]
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `aiProvider` | string | `"anthropic"` | AI provider to use (anthropic, openai, google) |
| `model` | string | `"claude-3-5-sonnet-20241022"` | Specific model to use |
| `workspace` | string | `"./"` | Workspace directory path |
| `sandboxEnabled` | boolean | `true` | Enable Docker sandboxing |
| `debugMode` | boolean | `false` | Enable debug logging |
| `maxTokens` | number | `4096` | Maximum tokens for AI responses |
| `temperature` | number | `0.2` | AI response randomness (0-1) |
| `plugins` | array | `[]` | Array of plugin names to load |
| `customAgents` | array | `[]` | Array of custom agent file paths |

## Environment Variables

You can also configure Ultra-Dex using environment variables:

```bash
# AI Provider Configuration
export ULTRA_DEX_AI_PROVIDER=anthropic
export ULTRA_DEX_MODEL=claude-3-5-sonnet-20241022

# API Keys
export ANTHROPIC_API_KEY=your-anthropic-key
export OPENAI_API_KEY=your-openai-key
export GOOGLE_AI_KEY=your-google-key

# Workspace Configuration
export ULTRA_DEX_WORKSPACE=./my-project
export ULTRA_DEX_SANDBOX_ENABLED=true

# Debugging
export ULTRA_DEX_DEBUG=true
export DEBUG=ultra-dex:*
```

## Command-Line Options

Most configuration options can also be specified as command-line arguments:

```bash
# Specify AI provider and model
ultra-dex --ai-provider openai --model gpt-4o

# Enable debug mode
ultra-dex --debug

# Specify workspace
ultra-dex --workspace ./my-project
```

## VS Code Extension Configuration

The VS Code extension can be configured through VS Code settings. Add to your `settings.json`:

```json
{
  "ultra-dex.defaultProvider": "anthropic",
  "ultra-dex.kernelPort": 3001,
  "ultra-dex.dashboardPort": 3002,
  "ultra-dex.autoStartKernel": false,
  "ultra-dex.enableSandbox": true
}
```

## MCP Configuration

For MCP (Model Context Protocol) integration, Ultra-Dex can generate configuration files:

```bash
# Generate MCP configuration for Claude Desktop
ultra-dex config --mcp

# Generate Cursor rules
ultra-dex config --cursor

# Generate VS Code settings
ultra-dex config --vscode
```

## Custom Agent Configuration

Custom agents can be configured in the `customAgents` array. Each agent should be a path to a JavaScript file that exports an agent configuration:

```javascript
// custom-agents/payment-agent.js
export default {
  name: '@Payment',
  description: 'Handles payment processing and billing',
  tier: '4-quality',
  prompt: `You are a payment processing expert...
  [Detailed agent prompt here]`
};
```

## Plugin Configuration

Plugins extend Ultra-Dex functionality. To use a plugin:

1. Install the plugin package:
```bash
npm install ultra-dex-plugin-auth
```

2. Add it to your configuration:
```json
{
  "plugins": ["ultra-dex-plugin-auth"]
}
```

## Troubleshooting Configuration

### Configuration Not Loading

If your configuration isn't being applied:

1. Verify the file is named `.ultra-dexrc` (note the dot)
2. Ensure it's in the correct location (project root or home directory)
3. Validate the JSON syntax
4. Check that environment variables don't override your settings

### Environment Variables Override

Environment variables take precedence over configuration files. If you're experiencing unexpected behavior, check your environment variables:

```bash
env | grep ULTRA_DEX
```

## Best Practices

- Keep sensitive information like API keys in environment variables, not in configuration files
- Use different configuration files for different projects
- Version control your configuration files (but exclude sensitive data)
- Test configuration changes in a development environment first