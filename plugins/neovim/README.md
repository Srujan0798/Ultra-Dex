# Ultra-Dex Neovim Plugin

A Neovim plugin that provides seamless integration with Ultra-Dex AI-powered development tools.

## Features

- **Command Integration**: Run Ultra-Dex commands directly from Neovim
- **Agent Selection**: Choose from various Ultra-Dex agents using Telescope
- **Swarm Functionality**: Execute swarm commands for collaborative AI tasks
- **Status Line Integration**: Monitor Ultra-Dex status from your status line
- **Asynchronous Execution**: Commands run without blocking Neovim

## Installation

Using [lazy.nvim](https://github.com/folke/lazy.nvim):

```lua
{
  "ultra-dex-neovim",
  dir = "~/Music/Ultra-Dex/plugins/neovim",
  dependencies = {
    "nvim-lua/plenary.nvim",
    "nvim-telescope/telescope.nvim"
  },
  config = function()
    require('ultra-dex').setup({
      ultra_dex_path = "~/Music/Ultra-Dex",  -- Path to your Ultra-Dex installation
      enabled = true,
      status_line_enabled = true,
      default_agent = "planner",
      debug = false
    })
  end
}
```

## Commands

- `:UltraDexSwarm [task]` - Run Ultra-Dex Swarm with specified task
- `:UltraDexAgent [agent] [task]` - Run Ultra-Dex with specified agent and task
- `:UltraDexStatus` - Show Ultra-Dex status
- `:UltraDexToggleStatusLine` - Toggle Ultra-Dex status line integration

## Telescope Extensions

- `<leader>us` or `:Telescope ultra_dex` - Select and run an Ultra-Dex agent
- `<leader>uw` or `:Telescope ud_swarm` - Run Ultra-Dex swarm via Telescope
- `<leader>ut` or `:Telescope ud_status` - View Ultra-Dex status via Telescope

## Configuration

The plugin can be configured with the following options:

```lua
require('ultra-dex').setup({
  ultra_dex_path = "~/Music/Ultra-Dex",  -- Path to Ultra-Dex installation
  enabled = true,                       -- Enable the plugin
  status_line_enabled = true,           -- Enable status line integration
  default_agent = "planner",            -- Default agent to use
  debug = false                         -- Enable debug output
})
```

## Status Line

The plugin adds Ultra-Dex information to your status line. You can customize this by adding `%{UltraDexStatus()}` to your statusline configuration.

## License

MIT