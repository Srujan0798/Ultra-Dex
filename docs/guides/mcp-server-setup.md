# MCP Server Setup for IDEs

The Model Context Protocol (MCP) server allows you to integrate Ultra-Dex directly into your IDE, providing AI-powered assistance for coding, planning, and execution tasks.

## What is MCP?

MCP is a protocol that enables AI assistants and tools to communicate with each other and with IDEs. The Ultra-Dex MCP server exposes orchestration, execution, and tracing capabilities as tools that can be used by AI assistants in your development environment.

## Installation

### 1. Install the MCP Server Package

```bash
npm install -g @ultra-dex/mcp-server
```

Or install locally in your project:

```bash
npm install --save-dev @ultra-dex/mcp-server
```

### 2. Verify Installation

```bash
ultra-dex-mcp --help
```

## IDE Integration

### VS Code + Claude

1. **Install Claude for VS Code extension**
2. **Configure MCP server in settings:**

```json
{
  "claude.server.mcp": {
    "ultra-dex": {
      "command": "ultra-dex-mcp",
      "args": [],
      "env": {
        "ULTRA_DEX_API_KEY": "your-api-key-here",
        "OPENAI_API_KEY": "your-openai-key",
        "ANTHROPIC_API_KEY": "your-anthropic-key"
      }
    }
  }
}
```

3. **Restart VS Code**

### Cursor IDE

1. **Open Cursor settings**
2. **Navigate to MCP configuration**
3. **Add Ultra-Dex server:**

```json
{
  "mcpServers": {
    "ultra-dex": {
      "command": "ultra-dex-mcp",
      "env": {
        "ULTRA_DEX_API_KEY": "your-api-key",
        "NODE_ENV": "development"
      }
    }
  }
}
```

### Other MCP-Compatible IDEs

The MCP server works with any IDE that supports the Model Context Protocol. Check your IDE's documentation for MCP configuration instructions.

## Available Tools

### 1. `ultra-dex-plan`

Plans complex tasks using Ultra-Dex's orchestration engine.

**Parameters:**

- `input` (string, required): The task description to plan
- `mode` (string, optional): Orchestration mode - "simple", "detailed", or "iterative"
- `context` (object, optional): Additional context for planning

**Example Usage:**

```
Plan a React component library with TypeScript support
```

### 2. `ultra-dex-execute`

Executes planned tasks using the execution engine.

**Parameters:**

- `taskId` (string, required): Unique identifier for the task
- `taskInput` (string, optional): Task description if creating new
- `agent` (string, optional): Agent to assign the task to
- `steps` (array, optional): Specific execution steps

**Example Usage:**

```
Execute the React component library implementation
```

### 3. `ultra-dex-trace`

Retrieves execution traces for debugging and analysis.

**Parameters:**

- `traceId` (string, required): The trace ID to retrieve

**Example Usage:**

```
Get trace for task-12345
```

## Usage Examples

### Code Planning and Implementation

1. **Plan a new feature:**

   ```
   Plan: Add user authentication to the React app with JWT tokens and protected routes
   ```

2. **Execute the implementation:**

   ```
   Execute: Implement JWT authentication with login/logout components
   ```

3. **Review the trace:**
   ```
   Get trace for the authentication implementation
   ```

### Refactoring Tasks

1. **Plan a refactoring:**

   ```
   Plan: Refactor the monolithic API into microservices architecture
   ```

2. **Execute step by step:**
   ```
   Execute: Extract user service from main API
   ```

### Testing and Quality Assurance

1. **Plan testing strategy:**

   ```
   Plan: Create comprehensive test suite for the e-commerce checkout flow
   ```

2. **Execute test implementation:**
   ```
   Execute: Implement unit and integration tests for payment processing
   ```

## Configuration

### Environment Variables

Set these environment variables to configure the MCP server:

```bash
# Ultra-Dex API configuration
ULTRA_DEX_API_KEY=your-api-key
ULTRA_DEX_BASE_URL=http://localhost:3000

# AI Provider keys (for execution)
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
GOOGLE_AI_API_KEY=your-google-key

# Execution settings
NODE_ENV=development
LOG_LEVEL=info
```

### Advanced Configuration

Create a `.env` file in your project root:

```env
# Ultra-Dex Configuration
ULTRA_DEX_API_KEY=your-production-key
ULTRA_DEX_BASE_URL=https://api.ultra-dex.ai

# Provider Configuration
OPENAI_API_KEY=sk-your-key
ANTHROPIC_API_KEY=sk-ant-your-key

# MCP Server Settings
MCP_SERVER_PORT=3001
MCP_ENABLE_DEBUG=true
MCP_LOG_REQUESTS=true
```

## Troubleshooting

### Common Issues

#### Server Won't Start

**Error:** `Command 'ultra-dex-mcp' not found`

**Solution:** Ensure the package is installed globally or use npx:

```bash
npx ultra-dex-mcp
```

#### Authentication Errors

**Error:** `API key invalid`

**Solution:** Check your environment variables:

```bash
echo $ULTRA_DEX_API_KEY
echo $OPENAI_API_KEY
```

#### Connection Issues

**Error:** `Failed to connect to MCP server`

**Solution:** Verify the server is running and accessible:

```bash
ps aux | grep ultra-dex-mcp
```

### Debug Mode

Enable debug logging:

```bash
DEBUG=ultra-dex:* ultra-dex-mcp
```

Or set in environment:

```bash
MCP_ENABLE_DEBUG=true ultra-dex-mcp
```

### Health Check

Test if the MCP server is responding:

```bash
curl -X POST http://localhost:3001/health \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Advanced Usage

### Custom Tool Development

You can extend the MCP server with custom tools by modifying the server code:

```javascript
// Add custom tool
server.registerTool(
  'custom-analysis',
  {
    title: 'Custom Code Analysis',
    description: 'Analyze code using custom rules',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        rules: { type: 'array' },
      },
      required: ['code'],
    },
  },
  async ({ code, rules }) => {
    // Your custom logic here
    const analysis = await analyzeCode(code, rules);
    return {
      content: [{ type: 'text', text: analysis }],
    };
  }
);
```

### Integration with CI/CD

Use the MCP server in automated workflows:

```yaml
# .github/workflows/code-review.yml
name: AI Code Review
on: [pull_request]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install MCP server
        run: npm install -g @ultra-dex/mcp-server
      - name: Run AI code review
        run: |
          ultra-dex-mcp plan "Review this pull request for security issues and best practices"
        env:
          ULTRA_DEX_API_KEY: ${{ secrets.ULTRA_DEX_KEY }}
```

### Multiple MCP Servers

Run multiple MCP servers for different purposes:

```json
{
  "claude.server.mcp": {
    "ultra-dex-planning": {
      "command": "ultra-dex-mcp",
      "args": ["--mode", "planning"]
    },
    "ultra-dex-execution": {
      "command": "ultra-dex-mcp",
      "args": ["--mode", "execution"]
    }
  }
}
```

## Best Practices

### Performance Optimization

1. **Use appropriate modes:** Choose "simple" for quick tasks, "detailed" for complex ones
2. **Cache results:** Enable caching for repeated operations
3. **Limit concurrent executions:** Set reasonable limits to avoid resource exhaustion

### Security Considerations

1. **Secure API keys:** Never commit keys to version control
2. **Network security:** Use HTTPS in production
3. **Access control:** Limit MCP server access to authorized users

### Monitoring and Logging

1. **Enable logging:** Set `LOG_LEVEL=debug` for detailed logs
2. **Monitor usage:** Track API usage and performance metrics
3. **Alert on failures:** Set up alerts for execution failures

## Support

- **Documentation:** [Ultra-Dex Docs](https://docs.ultra-dex.ai)
- **Issues:** [GitHub Issues](https://github.com/Srujan0798/Ultra-Dex/issues)
- **Community:** [Discord](https://discord.gg/ultra-dex)

For MCP-specific issues, check the [MCP documentation](https://modelcontextprotocol.io/) and your IDE's MCP integration guide.</content>
<parameter name="filePath">guides/mcp-server-setup.md
