-- ultra-dex.lua
-- Neovim plugin for Ultra-Dex integration
-- Author: Ultra-Dex Team
-- Description: Provides seamless integration with Ultra-Dex agents and workflows

local M = {}

-- Configuration options
M.config = {
  ultra_dex_path = vim.fn.expand("~/Music/Ultra-Dex"),
  enabled = true,
  status_line_enabled = true,
  default_agent = "planner",
  debug = false
}

-- Initialize the plugin
function M.setup(opts)
  opts = opts or {}
  M.config = vim.tbl_extend("force", M.config, opts)
  
  -- Setup commands
  M.setup_commands()
  
  -- Setup autocommands
  M.setup_autocmds()
  
  if M.config.debug then
    print("Ultra-Dex plugin initialized")
  end
end

-- Setup Ultra-Dex commands
function M.setup_commands()
  vim.api.nvim_create_user_command('UltraDexSwarm', function(opts)
    M.swarm_command(opts.args)
  end, {
    nargs = '*',
    desc = 'Run Ultra-Dex Swarm with specified task',
    complete = 'customlist,v:lua.ultra_dex_complete_agents'
  })

  vim.api.nvim_create_user_command('UltraDexAgent', function(opts)
    M.agent_command(opts.args)
  end, {
    nargs = '*',
    desc = 'Run Ultra-Dex with specified agent',
    complete = 'customlist,v:lua.ultra_dex_complete_agents'
  })
  
  vim.api.nvim_create_user_command('UltraDexStatus', function()
    M.show_status()
  end, {
    desc = 'Show Ultra-Dex status'
  })
  
  vim.api.nvim_create_user_command('UltraDexToggleStatusLine', function()
    M.toggle_status_line()
  end, {
    desc = 'Toggle Ultra-Dex status line integration'
  })
end

-- Setup autocommands
function M.setup_autocmds()
  vim.api.nvim_create_augroup('UltraDex', { clear = true })
  
  vim.api.nvim_create_autocmd('BufEnter', {
    group = 'UltraDex',
    callback = function()
      if M.config.status_line_enabled then
        M.update_status_line()
      end
    end,
    desc = 'Update Ultra-Dex status line'
  })
end

-- Get list of available agents
function M.get_agents()
  local agents = {
    { name = "planner", description = "Task breakdown and planning" },
    { name = "backend", description = "Backend development" },
    { name = "frontend", description = "Frontend development" },
    { name = "database", description = "Database schema and queries" },
    { name = "auth", description = "Authentication systems" },
    { name = "security", description = "Security review" },
    { name = "testing", description = "Write tests" },
    { name = "documentation", description = "Documentation" },
    { name = "reviewer", description = "Code review" },
    { name = "devops", description = "DevOps and deployment" },
    { name = "debugger", description = "Debugging assistance" },
    { name = "optimizer", description = "Performance optimization" }
  }
  return agents
end

-- Completion function for agents
function M.complete_agents()
  local agents = M.get_agents()
  local completions = {}
  for _, agent in ipairs(agents) do
    table.insert(completions, agent.name)
  end
  return completions
end

-- Swarm command implementation
function M.swarm_command(args)
  local task = args or vim.fn.input("Enter task for swarm: ")
  if task == "" then
    print("Task cannot be empty")
    return
  end
  
  -- Execute the swarm command
  local cmd = string.format("cd %s && npx ultra-dex swarm '%s'", M.config.ultra_dex_path, task)
  M.execute_async_command(cmd, "Swarm command executed")
end

-- Agent command implementation
function M.agent_command(args)
  local parts = {}
  for part in args:gmatch("%S+") do
    table.insert(parts, part)
  end
  
  local agent = parts[1] or vim.fn.input("Enter agent name: ")
  if agent == "" then
    print("Agent name cannot be empty")
    return
  end
  
  local task = table.concat({unpack(parts, 2)}, " ") or vim.fn.input("Enter task for agent: ")
  
  -- Validate agent exists
  local valid_agents = {}
  for _, a in ipairs(M.get_agents()) do
    table.insert(valid_agents, a.name)
  end
  
  if not vim.tbl_contains(valid_agents, agent) then
    print(string.format("Invalid agent: %s. Valid agents: %s", agent, table.concat(valid_agents, ", ")))
    return
  end
  
  -- Execute the agent command
  local cmd = string.format("cd %s && npx ultra-dex run %s '%s'", M.config.ultra_dex_path, agent, task)
  M.execute_async_command(cmd, string.format("Agent %s command executed", agent))
end

-- Execute command asynchronously
function M.execute_async_command(cmd, success_msg)
  if M.config.debug then
    print("Executing command: " .. cmd)
  end
  
  vim.fn.jobstart(cmd, {
    on_exit = function(_, code, _)
      if code == 0 then
        print(success_msg)
      else
        print("Command failed with exit code: " .. code)
      end
    end
  })
end

-- Show status
function M.show_status()
  local status = {
    enabled = M.config.enabled,
    ultra_dex_path = M.config.ultra_dex_path,
    status_line_enabled = M.config.status_line_enabled,
    default_agent = M.config.default_agent,
    agents_count = #M.get_agents()
  }
  
  print(vim.inspect(status))
end

-- Toggle status line
function M.toggle_status_line()
  M.config.status_line_enabled = not M.config.status_line_enabled
  print("Ultra-Dex status line: " .. (M.config.status_line_enabled and "enabled" or "disabled"))
  
  if M.config.status_line_enabled then
    M.update_status_line()
  end
end

-- Update status line with Ultra-Dex info
function M.update_status_line()
  -- Add Ultra-Dex info to the statusline
  local ultra_dex_info = "%#UltraDexStatus# %#UltraDexIcon# %#UltraDexStatusText#"
  ultra_dex_info = ultra_dex_info .. "⚡ Ultra-Dex"
  
  -- Append to existing statusline if it exists
  local current_statusline = vim.o.statusline or ""
  if current_statusline ~= "" then
    vim.o.statusline = current_statusline .. " %{UltraDexStatus()} "
  else
    vim.o.statusline = ultra_dex_info
  end
end

-- Function to be called from statusline
function M.status_line_component()
  if not M.config.enabled then
    return ""
  end
  
  -- Get current buffer info
  local bufname = vim.fn.bufname()
  local filename = vim.fn.fnamemodify(bufname, ":t")
  local filetype = vim.bo.filetype
  
  -- Format status info
  local status = string.format("⚡UD:%s", filetype ~= "" and filetype or "txt")
  
  return status
end

-- Telescope integration function
function M.telescope_select_agent(opts)
  opts = opts or {}
  
  local pickers = require "telescope.pickers"
  local finders = require "telescope.finders"
  local conf = require("telescope.config").values
  local actions = require "telescope.actions"
  local action_state = require "telescope.actions.state"
  
  local agents = M.get_agents()
  
  local agent_names = {}
  for _, agent in ipairs(agents) do
    table.insert(agent_names, {
      agent.name,
      agent.description
    })
  end
  
  pickers.new(opts, {
    prompt_title = "Ultra-Dex Agents",
    finder = finders.new_table {
      results = agent_names,
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
            M.agent_command(agent .. " " .. task)
          end
        end
      end)
      return true
    end,
  }):find()
end

-- Function to run swarm with telescope
function M.telescope_swarm(opts)
  opts = opts or {}
  
  local task = vim.fn.input("Enter swarm task: ")
  if task ~= "" then
    M.swarm_command(task)
  end
end

-- Register the global function for command completion
_G.ultra_dex_complete_agents = function(arg_lead, cmdline, cursor_pos)
  local completions = M.complete_agents()
  local result = {}
  for _, agent in ipairs(completions) do
    if agent:find("^" .. arg_lead) then
      table.insert(result, agent)
    end
  end
  return result
end

-- Global function for status line
_G.UltraDexStatus = function()
  return M.status_line_component()
end

return M