local M = {}

function M.setup(opts)
  vim.api.nvim_create_user_command("UltraDexStatus", function()
    require("ultra-dex.ui").show_status(opts)
  end, {})

  vim.api.nvim_create_user_command("UltraDexAgents", function()
    require("ultra-dex.ui").show_agents(opts)
  end, {})

  vim.api.nvim_create_user_command("UltraDexRun", function(args)
    require("ultra-dex.ui").run_agent(args.args, opts)
  end, { nargs = 1 })

  vim.api.nvim_create_user_command("UltraDexCheck", function()
    require("ultra-dex.ui").run_check(opts)
  end, {})
end

return M
