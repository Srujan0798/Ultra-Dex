# Ultra-Dex CLI Fish Completion

set -l ultra_dex_commands acp agents align api audit auth auto-implement autonomous batch brain browser build check ci-monitor cloud code-gen config cursor dashboard debug deploy diff doctor estimate examples exec export fetch fix generate github health hooks init integrate list memory metrics pack pipeline plan playground plugin pre-commit pty quality rag ralph repl review run scaffold scaffold-plan search serve setup state status suggest swarm sync sys-config team template undo upgrade validate vector-search verify voice watch watch-legacy workflow workspace

complete -c ultra-dex -f -a "$ultra_dex_commands"

# Common options
complete -c ultra-dex -l help -d "Show help"
complete -c ultra-dex -l version -d "Show version"

# Check command
complete -c ultra-dex -n '__fish_seen_subcommand_from check' -l p0-only -d "Check only P0 sections"
complete -c ultra-dex -n '__fish_seen_subcommand_from check' -l json -d "JSON output"
complete -c ultra-dex -n '__fish_seen_subcommand_from check' -l sections -r -d "Specific sections"

# Diff command
complete -c ultra-dex -n '__fish_seen_subcommand_from diff' -l drift -d "Drift analysis"
complete -c ultra-dex -n '__fish_seen_subcommand_from diff' -l json -d "JSON output"
complete -c ultra-dex -n '__fish_seen_subcommand_from diff' -l with-example -r -d "Compare with example"
complete -c ultra-dex -n '__fish_seen_subcommand_from diff' -l report -r -a '(__fish_complete_path)' -d "Write report"
complete -c ultra-dex -n '__fish_seen_subcommand_from diff' -l output -r -a '(__fish_complete_path)' -d "Alias for --report"

# Export command
complete -c ultra-dex -n '__fish_seen_subcommand_from export' -l format -r -a "json html md markdown pdf yaml yml" -d "Export format"
complete -c ultra-dex -n '__fish_seen_subcommand_from export' -l pdf -d "PDF export"
complete -c ultra-dex -n '__fish_seen_subcommand_from export' -l output -r -a '(__fish_complete_path)' -d "Output file"
complete -c ultra-dex -n '__fish_seen_subcommand_from export' -l sections -r -d "Section ranges"
complete -c ultra-dex -n '__fish_seen_subcommand_from export' -l include-agents -d "Include agent prompts"
complete -c ultra-dex -n '__fish_seen_subcommand_from export' -l toc -d "Include TOC"
complete -c ultra-dex -n '__fish_seen_subcommand_from export' -l template -r -a '(__fish_complete_path)' -d "Custom template"

# Scaffold command
complete -c ultra-dex -n '__fish_seen_subcommand_from scaffold' -l output -r -a '(__fish_complete_path)' -d "Output directory"
complete -c ultra-dex -n '__fish_seen_subcommand_from scaffold' -l list -d "List templates"
complete -c ultra-dex -n '__fish_seen_subcommand_from scaffold' -l from-plan -d "Scaffold from plan"
complete -c ultra-dex -n '__fish_seen_subcommand_from scaffold' -l dry-run -d "Preview plan-based output"
complete -c ultra-dex -n '__fish_seen_subcommand_from scaffold' -l force -d "Overwrite files"
complete -c ultra-dex -n '__fish_seen_subcommand_from scaffold' -l page -r -d "Page number"
complete -c ultra-dex -n '__fish_seen_subcommand_from scaffold' -l limit -r -d "Items per page"
complete -c ultra-dex -n '__fish_seen_subcommand_from scaffold' -l json -d "JSON output"

# Watch command
complete -c ultra-dex -n '__fish_seen_subcommand_from watch' -l debounce -r -d "Debounce interval"
complete -c ultra-dex -n '__fish_seen_subcommand_from watch' -l interval -r -d "Debounce interval (deprecated)"
complete -c ultra-dex -n '__fish_seen_subcommand_from watch' -l sync -d "Auto-sync CONTEXT.md"
complete -c ultra-dex -n '__fish_seen_subcommand_from watch' -l ignore -r -d "Ignore patterns"

# REPL command
complete -c ultra-dex -n '__fish_seen_subcommand_from repl' -l continue -d "Resume last session"

# Exec command
complete -c ultra-dex -n '__fish_seen_subcommand_from exec' -l code -r -d "Inline code"
complete -c ultra-dex -n '__fish_seen_subcommand_from exec' -l language -r -d "Language"
complete -c ultra-dex -n '__fish_seen_subcommand_from exec' -l timeout -r -d "Timeout ms"
complete -c ultra-dex -n '__fish_seen_subcommand_from exec' -l allow-network -d "Allow network"
complete -c ultra-dex -n '__fish_seen_subcommand_from exec' -l command -r -d "Shell command"
complete -c ultra-dex -n '__fish_seen_subcommand_from exec' -l test -d "Run tests"
complete -c ultra-dex -n '__fish_seen_subcommand_from exec' -l unsafe -d "Run on host"
complete -c ultra-dex -n '__fish_seen_subcommand_from exec' -l safe -d "Block risky execution"
complete -c ultra-dex -n '__fish_seen_subcommand_from exec' -l sandbox -d "Run in sandbox"
