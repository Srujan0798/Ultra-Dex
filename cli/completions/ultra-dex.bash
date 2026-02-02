#!/bin/bash
# Ultra-Dex CLI Bash Completion
# Source this file in your .bashrc or .bash_profile

_ultra_dex_completion() {
    local cur prev opts
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"
    
    # Main commands
    local commands="init generate build run swarm agents agent auto-implement serve dashboard watch ci-monitor status state sync memory align validate check doctor verify fix diff export pack config hooks upgrade exec search github cloud metrics health debug brain advanced estimate voice"
    
    # Options for specific commands
    case "${prev}" in
        init)
            COMPREPLY=( $(compgen -W "--template --force --skip-git" -- ${cur}) )
            return 0
            ;;
        run)
            local agents="planner backend frontend database security devops reviewer debugger"
            COMPREPLY=( $(compgen -W "${agents}" -- ${cur}) )
            return 0
            ;;
        swarm)
            COMPREPLY=( $(compgen -W "--dry-run --agents --timeout" -- ${cur}) )
            return 0
            ;;
        agents)
            COMPREPLY=( $(compgen -W "list install create publish --marketplace" -- ${cur}) )
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
        export)
            COMPREPLY=( $(compgen -W "--format --output" -- ${cur}) )
            return 0
            ;;
        validate|check|doctor|verify)
            COMPREPLY=( $(compgen -W "--json --fix" -- ${cur}) )
            return 0
            ;;
        config)
            COMPREPLY=( $(compgen -W "get set list reset" -- ${cur}) )
            return 0
            ;;
        --template)
            COMPREPLY=( $(compgen -W "lite full enterprise" -- ${cur}) )
            return 0
            ;;
        --provider)
            COMPREPLY=( $(compgen -W "openai anthropic google local" -- ${cur}) )
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
