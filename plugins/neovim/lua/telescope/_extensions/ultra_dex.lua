-- telescope/_extensions/ultra_dex.lua
-- Telescope extension for Ultra-Dex agent selection

local has_telescope, telescope = pcall(require, "telescope")

if not has_telescope then
  error("This plugin requires nvim-telescope/telescope.nvim")
end

local pickers = require "telescope.pickers"
local finders = require "telescope.finders"
local conf = require("telescope.config").values
local actions = require "telescope.actions"
local action_state = require "telescope.actions.state"

local ultra_dex = require("ultra-dex")

local M = {}

-- Select an agent using telescope
M.select_agent = function(opts)
  opts = opts or {}
  
  local agents = ultra_dex.get_agents()
  
  local agent_entries = {}
  for _, agent in ipairs(agents) do
    table.insert(agent_entries, {
      agent.name,
      agent.description
    })
  end
  
  pickers.new(opts, {
    prompt_title = "Ultra-Dex Agents",
    finder = finders.new_table {
      results = agent_entries,
      entry_maker = function(entry)
        return {
          value = entry[1],
          display = string.format("%-15s %s", entry[1], entry[2]),
          ordinal = entry[1],
        }
      end
    },
    sorter = conf.generic_sorter(opts),
    attach_mappings = function(prompt_bufnr, map)
      actions.select_default:replace(function()
        actions.close(prompt_bufnr)
        local selection = action_state.get_selected_entry()
        if selection then
          local agent = selection.value
          local task = vim.fn.input("Enter task for " .. agent .. ": ")
          if task ~= "" then
            ultra_dex.agent_command(agent .. " " .. task)
          end
        end
      end)
      return true
    end,
  }):find()
end

-- Run swarm using telescope
M.swarm = function(opts)
  opts = opts or {}
  
  local task = vim.fn.input("Enter swarm task: ")
  if task ~= "" then
    ultra_dex.swarm_command(task)
  end
end

-- Show status using telescope
M.status = function(opts)
  opts = opts or {}
  
  local status_info = {
    "Ultra-Dex Status:",
    "Enabled: " .. tostring(ultra_dex.config.enabled),
    "Path: " .. ultra_dex.config.ultra_dex_path,
    "Status Line: " .. tostring(ultra_dex.config.status_line_enabled),
    "Default Agent: " .. ultra_dex.config.default_agent,
    "Agents Available: " .. #ultra_dex.get_agents()
  }
  
  local status_picker = pickers.new(opts, {
    prompt_title = "Ultra-Dex Status",
    finder = finders.new_table {
      results = status_info,
      entry_maker = function(line)
        return {
          value = line,
          display = line,
          ordinal = line,
        }
      end
    },
    sorter = conf.generic_sorter(opts),
  })
  
  status_picker:find()
end

return telescope.register_extension({
  exports = {
    ultra_dex = M.select_agent,
    ud_agent = M.select_agent,
    ud_swarm = M.swarm,
    ud_status = M.status
  }
})