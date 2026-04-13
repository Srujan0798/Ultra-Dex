# Ultra-Dex VS Code Extension

Visual workflow editing, debugging, and monitoring for Ultra-Dex.

## Features

### 🎨 Visual Workflow Editor
- Interactive node-based workflow visualization
- Drag-and-drop node editing
- Real-time YAML synchronization
- Property panels for node configuration

### 🚀 Workflow Execution
- One-click workflow execution
- Integrated terminal output
- Keyboard shortcuts (Ctrl+Shift+R to run)

### 🐛 Debug Mode
- Break on errors
- Step-through execution
- Variable inspection

### 📊 Live Dashboard
- Embedded real-time dashboard
- Workflow execution metrics
- WebSocket integration

### 📁 Workflow Explorer
- Tree view of all .dex files
- Status indicators
- Quick access

## Commands

| Command | Keybinding | Description |
|---------|------------|-------------|
| `Ultra-Dex: Open Workflow Visualizer` | `Ctrl+Shift+V` | Open visual editor for .dex file |
| `Ultra-Dex: Run Workflow` | `Ctrl+Shift+R` | Execute workflow |
| `Ultra-Dex: Debug Workflow` | - | Debug with breakpoints |
| `Ultra-Dex: Show Live Dashboard` | - | Open dashboard panel |
| `Ultra-Dex: Validate Workflow` | - | Validate YAML structure |

## Configuration

```json
{
  "ultraDex.server.host": "localhost",
  "ultraDex.server.port": 8080,
  "ultraDex.debug.breakOnError": true,
  "ultraDex.dashboard.autoRefresh": true
}
```

## Requirements

- Ultra-Dex CLI installed globally or locally
- Node.js 18+

## Installation

1. Install from VS Code Marketplace (coming soon)
2. Or install from VSIX:
   ```bash
   cd extensions/vscode
   npm install
   npm run package
   code --install-extension ultra-dex-2.1.0.vsix
   ```

## Development

```bash
cd extensions/vscode
npm install
npm run compile
# Press F5 to launch extension host
```

## License

MIT
