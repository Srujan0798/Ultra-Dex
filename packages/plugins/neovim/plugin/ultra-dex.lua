-- plugin/ultra-dex.lua
-- Plugin specification for Ultra-Dex Neovim integration

local M = {}

-- Define the plugin
M.ultra_dex = {
  'ultra-dex-nvim',
  version = '1.0.0',
  description = 'Neovim integration for Ultra-Dex AI-powered development tools',
  author = 'Ultra-Dex Team',
  license = 'MIT',
  
  -- Dependencies
  dependencies = {
    'nvim-lua/plenary.nvim',
    'nvim-telescope/telescope.nvim'
  },
  
  -- Plugin initialization
  init = function()
    -- Set up default configuration
    local ultra_dex = require('ultra-dex')
    ultra_dex.setup({
      ultra_dex_path = vim.fn.expand("~/Music/Ultra-Dex"),
      enabled = true,
      status_line_enabled = true,
      default_agent = "planner",
      debug = false
    })
  end,
  
  -- Commands
  commands = {
    UltraDexSwarm = {
      description = 'Run Ultra-Dex Swarm with specified task',
      command = 'UltraDexSwarm'
    },
    UltraDexAgent = {
      description = 'Run Ultra-Dex with specified agent',
      command = 'UltraDexAgent'
    },
    UltraDexStatus = {
      description = 'Show Ultra-Dex status',
      command = 'UltraDexStatus'
    },
    UltraDexToggleStatusLine = {
      description = 'Toggle Ultra-Dex status line integration',
      command = 'UltraDexToggleStatusLine'
    }
  },
  
  -- Key mappings
  mappings = {
    { '<leader>us', ':Telescope ultra_dex<CR>', desc = 'Select Ultra-Dex agent' },
    { '<leader>ua', ':Telescope ud_agent<CR>', desc = 'Select Ultra-Dex agent' },
    { '<leader>uw', ':Telescope ud_swarm<CR>', desc = 'Run Ultra-Dex swarm' },
    { '<leader>ut', ':Telescope ud_status<CR>', desc = 'Show Ultra-Dex status' },
    { '<leader>ud', ':UltraDexSwarm<Space>', desc = 'Run Ultra-Dex swarm' },
    { '<leader>ua', ':UltraDexAgent<Space>', desc = 'Run Ultra-Dex agent' }
  }
}

return M