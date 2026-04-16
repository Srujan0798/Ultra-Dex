# VS Code Extension Overview

The Ultra-Dex VS Code Extension provides deep integration with Visual Studio Code, offering sidebar panels, agent controls, and seamless access to Ultra-Dex features directly within your IDE.

## Features

### Sidebar Panels

#### Agent Explorer
- Browse and manage all 18 Ultra-Dex agents
- View agent status and activity
- Run agents directly from the sidebar
- See agent descriptions and capabilities

#### Swarm Status
- Monitor ongoing agent swarms
- View progress and status updates
- See active agents and their tasks
- Access swarm controls and logs

#### Context Preview
- View current project context
- Access key project information
- See alignment scores and metrics
- Preview CONTEXT.md content

#### Quick Actions
- One-click access to common commands
- Generate plans, run swarms, check alignment
- Open dashboard and documentation
- Access frequently used features

### Context Menu Integration

#### "Ask @Agent about selection"
Right-click on selected code to ask specific agents about it:
- @Reviewer for code review
- @Debugger for debugging help
- @Security for security analysis
- @Performance for optimization

#### "Execute in Sandbox"
Run selected code snippets in a secure Docker sandbox.

### Status Bar Integration

- Real-time project alignment score
- Quick access to alignment checking
- Status indicators for system health

### Keyboard Shortcuts

- `Ctrl+Shift+A` (Cmd+Shift+A on Mac): Select Agent
- `Ctrl+Shift+S` (Cmd+Shift+S on Mac): Semantic Search
- `Ctrl+Shift+R` (Cmd+Shift+R on Mac): Run Swarm

## Installation

### From Marketplace (Recommended)

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` or `Cmd+Shift+X`)
3. Search for "Ultra-Dex"
4. Click Install
5. Reload VS Code when prompted

### From VSIX File

1. Download the `.vsix` file from the [releases page](https://github.com/Srujan0798/Ultra-Dex/releases)
2. Open VS Code
3. Go to Extensions
4. Click the "..." menu and select "Install from VSIX..."
5. Select the downloaded file
6. Reload VS Code

## Configuration

### Extension Settings

Configure the extension through VS Code settings:

```json
{
  "ultra-dex.defaultProvider": "anthropic",
  "ultra-dex.kernelPort": 3001,
  "ultra-dex.dashboardPort": 3002,
  "ultra-dex.autoStartKernel": false,
  "ultra-dex.enableSandbox": true
}
```

### Project Configuration

The extension respects project-level configuration from `.ultra-dexrc` files.

## Usage

### Starting the Kernel

The Ultra-Dex kernel provides real-time updates and communication:

1. Use the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Run "Ultra-Dex: Start Active Kernel"
3. Or enable "Auto-start kernel" in settings

### Running Agents

#### From Sidebar
1. Open the Agent Explorer panel
2. Right-click on an agent
3. Select "Run Agent"
4. Enter the task description

#### From Command Palette
1. Open command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Run "Ultra-Dex: Select Agent"
3. Choose an agent from the list
4. Enter your task description

### Running Swarms

1. Use the command palette
2. Run "Ultra-Dex: Run Agent Swarm"
3. Enter the swarm objective
4. Monitor progress in the Swarm Status panel

### Checking Alignment

1. Click the alignment indicator in the status bar
2. Or use command palette: "Ultra-Dex: Check Alignment"
3. View the alignment score and details

## Troubleshooting

### Extension Not Loading

- Verify VS Code version (requires 1.80.0 or higher)
- Check for conflicting extensions
- Look for errors in the developer console (`Help > Toggle Developer Tools`)

### Agent Communication Issues

- Ensure the Ultra-Dex kernel is running
- Check network connectivity
- Verify API key configuration
- Review extension logs

### Performance Issues

- Disable auto-refresh if not needed
- Limit the number of active agents
- Check system resource usage
- Review extension settings

### MCP Integration Problems

- Verify MCP server is accessible
- Check Claude Desktop/Cursor configuration
- Ensure proper permissions
- Review MCP logs

## Customization

### Themes

The extension supports VS Code's theming system and includes special styling for:
- Agent status indicators
- Progress bars
- Status messages
- Error notifications

### Key Bindings

Customize keyboard shortcuts in VS Code's keybinding settings:
- Open `Preferences: Open Keyboard Shortcuts` from command palette
- Search for "Ultra-Dex" commands
- Modify keybindings as needed

## Best Practices

- Keep the extension updated for latest features
- Use the sidebar panels for efficient workflow
- Leverage context menu integration for code-specific tasks
- Monitor alignment scores regularly
- Use the sandbox for experimental code execution

## Known Issues

- Large projects may take time to initialize
- Some features require internet connectivity
- MCP integration requires proper configuration
- Docker is recommended for sandbox functionality

## Next Steps

- Review the [Getting Started Guide](/docs/getting-started/quick-start) for initial setup
- Read the [CLI Overview](/docs/cli/overview) for command-line usage
- Check the [MCP Integration Guide](/docs/mcp/overview) for AI tool connections