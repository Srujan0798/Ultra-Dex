#!/bin/bash
# Ultra-Dex CLI Bash Completion
# Source this file in your .bashrc or .bash_profile

_ultra_dex_completion() {
    local cur prev opts
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"
    
    # Main commands
    local commands="acp add agents align api audit auth auto-implement autonomous batch brain browser build check ci-monitor cloud code-gen config cursor dashboard debug deploy diff doctor estimate examples exec export fetch fix generate github health hooks init integrate list memory metrics pack pipeline plan playground plugin pre-commit pty quality rag ralph repl review run scaffold scaffold-plan search serve setup state status suggest swarm sync sys-config team template undo upgrade validate vector-search verify voice watch watch-legacy workflow workspace"
    
    # Options for specific commands
    case "${prev}" in
        init)
            COMPREPLY=( $(compgen -W "--template --force --skip-git" -- ${cur}) )
            return 0
            ;;
        run)
            local agents="architect meta-orchestrator orchestrator cto planner research backend database frontend auth security devops debugger documentation reviewer testing performance refactoring"
            COMPREPLY=( $(compgen -W "${agents}" -- ${cur}) )
            return 0
            ;;
        swarm)
            COMPREPLY=( $(compgen -W "--dry-run --parallel --agents --timeout" -- ${cur}) )
            return 0
            ;;
        agents)
            COMPREPLY=( $(compgen -W "list install create publish --marketplace" -- ${cur}) )
            return 0
            ;;
        plugin)
            COMPREPLY=( $(compgen -W "list marketplace create install uninstall info update search" -- ${cur}) )
            return 0
            ;;
        browser)
            COMPREPLY=( $(compgen -W "screenshot scrape test record mockup audit" -- ${cur}) )
            return 0
            ;;
        sync)
            COMPREPLY=( $(compgen -W "--brain --watch --force" -- ${cur}) )
            return 0
            ;;
        memory)
            COMPREPLY=( $(compgen -W "list add search clear sessions decisions query stats" -- ${cur}) )
            return 0
            ;;
        estimate)
            COMPREPLY=( $(compgen -W "simple-task feature-impl plan-generation complex-refactor agent-swarm context-sync --tokens --provider --monthly --json" -- ${cur}) )
            return 0
            ;;
        voice)
            COMPREPLY=( $(compgen -W "--provider --language --output --template --save-audio test setup" -- ${cur}) )
            return 0
            ;;
        watch)
            COMPREPLY=( $(compgen -W "--debounce --interval --sync --ignore" -- ${cur}) )
            return 0
            ;;
        export)
            COMPREPLY=( $(compgen -W "--format --output --sections --include-agents --pdf --toc --template" -- ${cur}) )
            return 0
            ;;
        validate|check|doctor|verify)
            COMPREPLY=( $(compgen -W "--json --p0-only --sections" -- ${cur}) )
            return 0
            ;;
        diff)
            COMPREPLY=( $(compgen -W "--json --drift --with-example --report --output" -- ${cur}) )
            return 0
            ;;
        repl)
            COMPREPLY=( $(compgen -W "--continue" -- ${cur}) )
            return 0
            ;;
        scaffold)
            COMPREPLY=( $(compgen -W "--output --list --from-plan --dry-run --force --page --limit --json" -- ${cur}) )
            return 0
            ;;
        scaffold-plan)
            COMPREPLY=( $(compgen -W "--dry-run --force" -- ${cur}) )
            return 0
            ;;
        setup)
            COMPREPLY=( $(compgen -W "--quick --reset --completions" -- ${cur}) )
            return 0
            ;;
        config)
            COMPREPLY=( $(compgen -W "--mcp --cursor --vscode --show --set --get" -- ${cur}) )
            return 0
            ;;
        --template)
            COMPREPLY=( $(compgen -W "lite full enterprise" -- ${cur}) )
            return 0
            ;;
        --provider)
            COMPREPLY=( $(compgen -W "openai anthropic google gemini ollama local" -- ${cur}) )
            return 0
            ;;
        --agents)
            COMPREPLY=( $(compgen -W "architect meta-orchestrator orchestrator cto planner research backend database frontend auth security devops debugger documentation reviewer testing performance refactoring" -- ${cur}) )
            return 0
            ;;
    esac
    
    # Complete main commands
    if [[ ${cur} == -* ]]; then
        COMPREPLY=( $(compgen -W "--help --version --verbose --debug --json" -- ${cur}) )
    else
        COMPREPLY=( $(compgen -W "${commands}" -- ${cur}) )
    fi
}

complete -F _ultra_dex_completion ultra-dex
complete -F _ultra_dex_completion npx ultra-dex
