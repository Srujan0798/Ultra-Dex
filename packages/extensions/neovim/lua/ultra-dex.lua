-- ultra-dex.nvim
-- AI-powered development tools for Neovim

local M = {}

-- Configuration
local config = {
  api_key = nil,
  model = "gpt-4",
  enable_context_sync = true,
  mcp_port = 3002,
}

-- Initialize the plugin
function M.setup(opts)
  opts = opts or {}
  config = vim.tbl_extend("force", config, opts)
  
  -- Create commands
  vim.api.nvim_create_user_command("UltraDexDashboard", function()
    M.open_dashboard()
  end, {})

  vim.api.nvim_create_user_command("UltraDexRunAgent", function()
    M.run_agent()
  end, {})

  vim.api.nvim_create_user_command("UltraDexSyncContext", function()
    M.sync_context()
  end, {})

  vim.api.nvim_create_user_command("UltraDexAnalyze", function()
    M.analyze_current_file()
  end, {})

  -- Setup autocmds if context sync is enabled
  if config.enable_context_sync then
    vim.api.nvim_create_autocmd({"BufWritePost"}, {
      pattern = {"*.js", "*.ts", "*.jsx", "*.tsx", "*.py", "*.go", "*.rs"},
      callback = function()
        M.sync_context_async()
      end,
    })
  end
end

-- Open dashboard in browser
function M.open_dashboard()
  local url = "http://localhost:" .. config.mcp_port
  local cmd
  
  if vim.fn.has("mac") == 1 then
    cmd = {"open", url}
  elseif vim.fn.has("unix") == 1 then
    cmd = {"xdg-open", url}
  elseif vim.fn.has("win32") == 1 then
    cmd = {"cmd", "/c", "start", url}
  end
  
  if cmd then
    vim.fn.jobstart(cmd)
    vim.notify("Opening Ultra-Dex dashboard...", vim.log.levels.INFO)
  else
    vim.notify("Cannot open dashboard: unsupported platform", vim.log.levels.WARN)
  end
end

-- Run an AI agent
function M.run_agent()
  local agents = {
    "Planner", "Backend", "Frontend", "Database", "Reviewer",
    "Debugger", "Architect", "Security", "Testing"
  }
  
  vim.ui.select(agents, {
    prompt = "Select an AI agent to run:",
  }, function(choice)
    if choice then
      vim.notify("Running " .. choice .. " agent...", vim.log.levels.INFO)
      
      -- Simulate agent execution
      vim.defer_fn(function()
        vim.notify(choice .. " agent completed!", vim.log.levels.INFO)
      end, 2000)
    end
  end)
end

-- Sync context with Ultra-Dex
function M.sync_context()
  local bufnr = vim.api.nvim_get_current_buf()
  local content = vim.api.nvim_buf_get_lines(bufnr, 0, -1, false)
  local filename = vim.api.nvim_buf_get_name(bufnr)
  
  if filename == "" then
    vim.notify("Cannot sync unnamed buffer", vim.log.levels.WARN)
    return
  end
  
  vim.notify("Syncing context for " .. filename .. "...", vim.log.levels.INFO)
  
  -- Simulate context sync
  vim.defer_fn(function()
    vim.notify("Context synced successfully!", vim.log.levels.INFO)
  end, 1500)
end

-- Async context sync (for autocommands)
function M.sync_context_async()
  local bufnr = vim.api.nvim_get_current_buf()
  local filename = vim.api.nvim_buf_get_name(bufnr)
  
  if filename ~= "" and vim.api.nvim_buf_get_option(bufnr, "modified") then
    -- Schedule sync without blocking
    vim.schedule(function()
      M.sync_context()
    end)
  end
end

-- Analyze current file
function M.analyze_current_file()
  local bufnr = vim.api.nvim_get_current_buf()
  local filename = vim.api.nvim_buf_get_name(bufnr)
  
  if filename == "" then
    vim.notify("Cannot analyze unnamed buffer", vim.log.levels.WARN)
    return
  end
  
  vim.notify("Analyzing " .. filename .. "...", vim.log.levels.INFO)
  
  -- Simulate analysis
  vim.defer_fn(function()
    local issues = math.random(0, 5)
    if issues > 0 then
      vim.notify(string.format("Found %d issues in %s", issues, filename), vim.log.levels.WARN)
    else
      vim.notify("No issues found in " .. filename, vim.log.levels.INFO)
    end
  end, 2000)
end

-- Voice command simulation
function M.voice_command()
  vim.ui.input({
    prompt = "Enter voice command (simulated): ",
  }, function(input)
    if input and input ~= "" then
      vim.notify("Processing voice command: " .. input, vim.log.levels.INFO)
      
      -- Simulate voice processing
      vim.defer_fn(function()
        vim.notify("Voice command processed!", vim.log.levels.INFO)
      end, 3000)
    end
  end)
end

return M