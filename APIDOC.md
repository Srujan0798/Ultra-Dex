# Ultra-Dex API Documentation

## Overview
Ultra-Dex is an AI orchestration meta-layer that provides structure, memory, and architectural context for AI assistants. This documentation covers the core API and command interfaces.

## Command Line Interface

### Core Commands

#### `ultra-dex init`
Initializes a new Ultra-Dex project with the required structure and files.

**Usage:**
```
ultra-dex init [options]
```

**Options:**
- `-n, --name <name>`: Project name
- `-d, --dir <directory>`: Output directory (default: ".")
- `--preview`: Preview files without creating them
- `--live`: Generate a runnable scaffold
- `--stack <preset>`: Preset: next15-prisma-clerk, remix-supabase, sveltekit-drizzle

#### `ultra-dex generate [idea]`
Creates the full 34-section implementation plan from an idea using AI.

**Usage:**
```
ultra-dex generate [idea] [options]
```

**Options:**
- `-p, --provider <provider>`: AI provider (claude, openai, gemini)
- `-m, --model <model>`: Specific model to use
- `-o, --output <directory>`: Output directory (default: ".")
- `-k, --key <apiKey>`: API key (or use environment variable)
- `--stream`: Stream output in real-time (default: true)
- `--no-stream`: Disable streaming

#### `ultra-dex build`
Auto-Pilot: Executes the next pending task from the plan using AI agents.

**Usage:**
```
ultra-dex build [options]
```

**Options:**
- `-p, --provider <provider>`: AI provider
- `-k, --key <apiKey>`: API key
- `--dry-run`: Preview the task without executing

#### `ultra-dex review`
Reviews code against the implementation plan using AI.

**Usage:**
```
ultra-dex review [options]
```

**Options:**
- `-d, --dir <directory>`: Directory to review (default: ".")
- `-p, --provider <provider>`: AI provider (claude, openai, gemini)
- `-k, --key <apiKey>`: API key
- `--quick`: Quick review without AI (checks file structure only)
- `--json`: Output as JSON

#### `ultra-dex serve`
Opens the Active Kernel (MCP + WebSocket + Dashboard).

**Usage:**
```
ultra-dex serve [options]
```

**Options:**
- `-p, --port <port>`: Port to listen on (default: "3001")
- `--stdio`: Run in Stdio mode (MCP Standard Only) (default: false)

#### `ultra-dex swarm <task>`
Runs an autonomous agent pipeline.

**Usage:**
```
ultra-dex swarm <task> [options]
```

**Options:**
- `--dry-run`: Show pipeline without executing
- `--parallel`: Run implementation tier agents in parallel

#### `ultra-dex validate`
Validates project structure against Ultra-Dex standards.

**Usage:**
```
ultra-dex validate [options]
```

**Options:**
- `-d, --dir <directory>`: Project directory to validate (default: ".")
- `--scan`: Run deep code quality scan

### Advanced Commands

#### `ultra-dex config`
Shows or generates configuration.

**Usage:**
```
ultra-dex config [options]
```

**Options:**
- `--mcp`: Generate MCP config for Claude Desktop
- `--cursor`: Generate Cursor IDE rules
- `--vscode`: Generate VS Code settings.json
- `--show`: Display current Ultra-Dex config
- `--set <key=value>`: Set a config value
- `--get <key>`: Get a specific config value

#### `ultra-dex dashboard`
Starts the local web dashboard for monitoring Ultra-Dex projects.

**Usage:**
```
ultra-dex dashboard [options]
```

**Options:**
- `-p, --port <port>`: Port to listen on (default: "3002")

#### `ultra-dex status`
Shows current project state.

**Usage:**
```
ultra-dex status [options]
```

**Options:**
- `--refresh`: Refresh state before showing
- `--json`: Output raw JSON

#### `ultra-dex metrics`
Shows performance metrics.

**Usage:**
```
ultra-dex metrics [options]
```

**Options:**
- `--json`: Output as JSON

#### `ultra-dex health`
Checks system health.

**Usage:**
```
ultra-dex health [options]
```

**Options:**
- `--json`: Output as JSON

## Programmatic API

### Graph API

The CodeGraph class provides programmatic access to the project structure analysis:

```javascript
import { projectGraph } from './lib/mcp/graph.js';

// Scan the project
const summary = await projectGraph.scan();

// Get summary information
console.log(`Nodes: ${summary.nodeCount}, Edges: ${summary.edgeCount}`);

// Find references to a file
const references = projectGraph.findReferences('some-file.js');
```

### State Management API

The state management system provides access to project state:

```javascript
import { loadState, saveState, generateMarkdown } from './lib/commands/state.js';

// Load current state
const state = await loadState();

// Save updated state
await saveState(newState);

// Generate markdown representation
const markdown = generateMarkdown(state);
```

### Quality Scanning API

The quality scanner provides code analysis capabilities:

```javascript
import { runQualityScan } from './lib/quality/scanner.js';

// Run quality scan on a directory
const results = await runQualityScan('./path/to/project');

console.log(`Passed: ${results.passed}, Failed: ${results.failed}, Warnings: ${results.warnings}`);
```

## Configuration

Ultra-Dex can be configured through environment variables or the config system:

### Environment Variables
- `LOG_LEVEL`: Logging level (default: "info")
- `LOG_FILE`: Log file path (default: ".ultra-dex/logs/ultra-dex.log")
- `METRICS_ENABLED`: Enable metrics (default: true)
- `HEALTH_CHECK_INTERVAL`: Health check interval in ms (default: 30000)
- `MAX_LOG_SIZE`: Maximum log file size (default: "20m")
- `MAX_LOG_FILES`: Maximum number of log files (default: 5)

### AI Provider Configuration
- `ANTHROPIC_API_KEY`: Claude API key
- `OPENAI_API_KEY`: OpenAI API key
- `GOOGLE_AI_KEY`: Google Gemini API key

## Error Handling

Ultra-Dex implements comprehensive error handling with circuit breakers and fallback mechanisms:

```javascript
import { errorRecovery } from './lib/utils/error-recovery.js';

// Execute operation with recovery
try {
  const result = await errorRecovery.executeWithRecovery(
    'service-name',
    async () => {
      // Your operation here
      return await someOperation();
    },
    {
      maxRetries: 3,
      retryDelay: 1000,
      strategy: 'retry',
      fallback: async () => {
        // Fallback operation
        return await fallbackOperation();
      }
    }
  );
} catch (error) {
  console.error('Operation failed after all recovery attempts:', error);
}
```

## Best Practices

1. **Initialization**: Always run `ultra-dex init` before starting a new project
2. **Planning**: Use `ultra-dex generate` to create comprehensive plans before implementation
3. **Validation**: Regularly run `ultra-dex validate` to ensure project standards
4. **Review**: Use `ultra-dex review` to check code against plans
5. **Monitoring**: Monitor system health with `ultra-dex status`, `ultra-dex metrics`, and `ultra-dex health`

## Troubleshooting

### Common Issues

1. **API Key Issues**: Ensure your API keys are properly set in environment variables
2. **File Permissions**: Check that Ultra-Dex has read/write access to project directories
3. **Network Issues**: Verify internet connectivity for AI provider access
4. **Memory Issues**: Large projects may require increased Node.js memory limits

### Debugging

Enable debug mode by setting the DEBUG environment variable:
```
DEBUG=true ultra-dex command
```

## Support

For additional support, consult the community forums or submit an issue on the GitHub repository.