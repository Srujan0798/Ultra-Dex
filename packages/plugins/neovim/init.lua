-- plugins/neovim/init.lua
-- Entry point for Ultra-Dex Neovim plugin

-- Require the main ultra-dex module
local ultra_dex = require('ultra-dex')

-- Default configuration
local default_config = {
  ultra_dex_path = vim.fn.expand("~/Music/Ultra-Dex"),
  enabled = true,
  status_line_enabled = true,
  default_agent = "planner",
  debug = false
}

-- Setup function
local M = {}

M.setup = function(config)
  config = vim.tbl_deep_extend("force", default_config, config or {})
  ultra_dex.setup(config)
end

-- Export the setup function
return M