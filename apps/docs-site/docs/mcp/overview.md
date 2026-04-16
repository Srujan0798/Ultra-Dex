# MCP Integration Overview

The Model Context Protocol (MCP) integration enables Ultra-Dex to seamlessly connect with AI coding tools like Cursor, Claude Desktop, and other MCP-compatible clients. This creates a unified development environment where AI tools can access project context and execute commands through Ultra-Dex.

## What is MCP?

The Model Context Protocol (MCP) is an open standard that allows AI coding tools to securely access project context, execute commands, and interact with development tools. Ultra-Dex implements MCP to provide a bridge between AI assistants and your development workflow.

## Supported MCP Clients

### Cursor
- Native integration with Cursor IDE
- Real-time context synchronization
- Command execution through Ultra-Dex agents
- File system access with proper permissions

### Claude Desktop
- Claude Desktop integration
- Secure context sharing
- Multi-modal AI capabilities
- Enterprise security features

### Other MCP-Compatible Tools
- JetBrains MCP plugins
- VS Code MCP extensions
- Custom MCP clients

## Setting Up MCP Integration

### Automatic Configuration

Generate MCP configuration automatically:

```bash
# Generate Claude Desktop configuration
ultra-dex config --mcp

# Generate Cursor rules
ultra-dex config --cursor

# Generate VS Code settings
ultra-dex config --vscode
```

### Manual Configuration

#### Claude Desktop Setup

1. Run the configuration command:
```bash
ultra-dex serve --stdio
```

2. Add the MCP server configuration to Claude Desktop:
```json
{
  "mcpServers": {
    "ultra-dex": {
      "command": "npx",
      "args": [
        "ultra-dex",
        "serve",
        "--stdio"
      ],
      "cwd": "/path/to/your/project"
    }
  }
}
```

3. Locate the Claude Desktop config file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

#### Cursor Setup

1. Generate Cursor rules:
```bash
ultra-dex config --cursor
```

2. This creates `.cursor/rules/ultra-dex.mdc` with project-specific instructions

3. Cursor will automatically load these rules

## MCP Tools Provided

Ultra-Dex exposes several MCP tools that AI assistants can use:

### File Operations
- `read_code`: Read file contents
- `write_code`: Write/modify files
- `path_exists`: Check if files/directories exist
- `list_files`: List directory contents

### Project Management
- `update_task_status`: Update task status in project state
- `get_agent`: Retrieve agent definitions
- `query_codebase`: Search and analyze codebase

### Context Management
- `get_context`: Retrieve project context
- `get_plan`: Access implementation plan
- `get_state`: Get project state

## Security Features

### Sandboxing
- All code execution runs in Docker containers
- Isolated environment for each operation
- Resource limits to prevent abuse
- Network restrictions for security

### Permissions
- Granular file system access controls
- Command execution restrictions
- API key protection
- Environment variable isolation

### Audit Trail
- All MCP operations logged
- Activity monitoring
- Compliance reporting
- Security incident tracking

## Configuration Options

### MCP Server Configuration

```bash
# Start MCP server on specific port
ultra-dex serve --port 3001

# Start in stdio mode for MCP clients
ultra-dex serve --stdio

# Enable/disable specific tools
ultra-dex serve --tools read_code,write_code
```

### Security Settings

Configure security in `.ultra-dexrc`:

```json
{
  "mcp": {
    "enableSandbox": true,
    "allowedCommands": ["git", "npm", "yarn"],
    "fileAccessWhitelist": ["./src", "./docs"],
    "commandTimeout": 30000
  }
}
```

## Troubleshooting

### Connection Issues
- Verify MCP server is running: `ultra-dex serve --stdio`
- Check configuration file paths
- Ensure proper permissions
- Validate API keys

### Security Restrictions
- Review sandbox configuration
- Check file access permissions
- Verify command whitelisting
- Adjust security settings as needed

### Performance Issues
- Monitor resource usage
- Adjust timeout settings
- Optimize file access patterns
- Review concurrent operation limits

## Best Practices

- Always use sandboxing in production environments
- Regularly review and update security policies
- Monitor MCP usage and logs
- Keep MCP clients updated
- Test configurations in development first

## Next Steps

- Review the [Provider Guide](/docs/providers) for supported AI providers
- Read the [Extensions Guide](/docs/extensions) for plugin development
- Check the [Troubleshooting Guide](/docs/troubleshooting) for common issues