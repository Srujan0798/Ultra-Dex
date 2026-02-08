local M = {}

function M.setup(opts)
  M.opts = opts or {}
  require("ultra-dex.commands").setup(M.opts)
end

return M
