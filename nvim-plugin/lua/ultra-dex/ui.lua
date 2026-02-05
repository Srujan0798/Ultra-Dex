local M = {}

local function notify(msg)
  vim.notify(msg, vim.log.levels.INFO, { title = "Ultra-Dex" })
end

function M.show_status(_opts)
  notify("Ultra-Dex status: connect to http://localhost:3001")
end

function M.show_agents(_opts)
  notify("Agents: architect, backend, frontend, qa, security")
end

function M.run_agent(agent, _opts)
  notify("Running agent: " .. agent)
end

function M.run_check(_opts)
  notify("Running ultra-dex check")
end

return M
