#!/bin/bash

# Ultra-Dex CLI Enhancement Script
# Provides additional CLI commands for the enhanced Ultra-Dex

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ULTRA_DEX_DIR="${SCRIPT_DIR}/.."
NODE_CMD="node"

cd "$ULTRA_DEX_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_banner() {
    echo -e "${BLUE}"
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║              Ultra-Dex v6.0.0 CLI Tool                 ║"
    echo "║          AI Orchestration Meta-Layer                   ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

show_help() {
    print_banner
    echo ""
    echo "Usage: ultra-dex-enhanced <command> [options]"
    echo ""
    echo "Commands:"
    echo "  init              Initialize Ultra-Dex with new components"
    echo "  validate          Run validation tests"
    echo "  test              Run integration tests"
    echo "  start             Start Ultra-Dex services"
    echo "  stop              Stop Ultra-Dex services"
    echo "  status            Check system status"
    echo "  health            Run health check"
    echo "  deploy            Deploy Ultra-Dex (local/docker/k8s)"
    echo "  config            Manage configuration"
    echo "  logs              View system logs"
    echo "  backup            Create backup"
    echo "  restore           Restore from backup"
    echo "  monitor           Start monitoring dashboard"
    echo "  optimize          Run optimization analysis"
    echo "  version           Show version information"
    echo "  help              Show this help message"
    echo ""
    echo "Options:"
    echo "  --env <env>       Environment (development/staging/production)"
    echo "  --verbose         Verbose output"
    echo "  --dry-run         Show what would be done without executing"
    echo ""
}

cmd_init() {
    echo -e "${BLUE}Initializing Ultra-Dex...${NC}"
    
    # Create data directories
    mkdir -p data/{memory,observability,autopsy,mcp-servers}
    
    # Create config directory
    mkdir -p config
    
    # Copy environment template if doesn't exist
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            echo -e "${YELLOW}Created .env file from template. Please edit it with your settings.${NC}"
        fi
    fi
    
    echo -e "${GREEN}✓ Initialization complete${NC}"
}

cmd_validate() {
    echo -e "${BLUE}Running validation tests...${NC}"
    $NODE_CMD test-validation.cjs
    echo -e "${GREEN}✓ Validation complete${NC}"
}

cmd_test() {
    echo -e "${BLUE}Running integration tests...${NC}"
    $NODE_CMD tests/integration/core-integration.test.cjs
    echo -e "${GREEN}✓ Integration tests complete${NC}"
}

cmd_start() {
    echo -e "${BLUE}Starting Ultra-Dex services...${NC}"
    
    # Check if already running
    if [ -f ".pid" ]; then
        PID=$(cat .pid)
        if ps -p $PID > /dev/null 2>&1; then
            echo -e "${YELLOW}Ultra-Dex is already running (PID: $PID)${NC}"
            return
        fi
    fi
    
    # Start in background
    nohup $NODE_CMD -e "
        const { UltraDex } = require('./sdk.cjs');
        const ultra = new UltraDex();
        ultra.initialize().then(() => ultra.start()).then(() => {
            console.log('Ultra-Dex started successfully');
            console.log('Press Ctrl+C to stop');
        }).catch(err => {
            console.error('Failed to start:', err);
            process.exit(1);
        });
    " > logs/ultra-dex.log 2>&1 &
    
    echo $! > .pid
    echo -e "${GREEN}✓ Ultra-Dex started (PID: $(cat .pid))${NC}"
    echo -e "${BLUE}Logs: tail -f logs/ultra-dex.log${NC}"
}

cmd_stop() {
    echo -e "${BLUE}Stopping Ultra-Dex services...${NC}"
    
    if [ -f ".pid" ]; then
        PID=$(cat .pid)
        if ps -p $PID > /dev/null 2>&1; then
            kill $PID
            rm .pid
            echo -e "${GREEN}✓ Ultra-Dex stopped${NC}"
        else
            echo -e "${YELLOW}Ultra-Dex is not running${NC}"
            rm .pid
        fi
    else
        echo -e "${YELLOW}Ultra-Dex is not running${NC}"
    fi
}

cmd_status() {
    echo -e "${BLUE}Ultra-Dex Status:${NC}"
    
    if [ -f ".pid" ]; then
        PID=$(cat .pid)
        if ps -p $PID > /dev/null 2>&1; then
            echo -e "${GREEN}Status: Running (PID: $PID)${NC}"
        else
            echo -e "${RED}Status: Not running (stale PID file)${NC}"
            rm .pid
        fi
    else
        echo -e "${YELLOW}Status: Not running${NC}"
    fi
    
    # Show data directory size
    if [ -d "data" ]; then
        DATA_SIZE=$(du -sh data 2>/dev/null | cut -f1)
        echo "Data directory: $DATA_SIZE"
    fi
}

cmd_health() {
    echo -e "${BLUE}Running health check...${NC}"
    
    $NODE_CMD -e "
        const { UltraDex } = require('./sdk.cjs');
        const ultra = new UltraDex();
        ultra.initialize().then(() => {
            const health = ultra.health();
            console.log(JSON.stringify(health, null, 2));
            process.exit(health.healthy ? 0 : 1);
        }).catch(err => {
            console.error('Health check failed:', err.message);
            process.exit(1);
        });
    "
}

cmd_deploy() {
    local env=${1:-local}
    echo -e "${BLUE}Deploying Ultra-Dex to $env...${NC}"
    
    case "$env" in
        local)
            ./deploy.sh local
            ;;
        docker)
            docker-compose up -d
            ;;
        k8s|kubernetes)
            ./deploy.sh production
            ;;
        *)
            echo -e "${RED}Unknown environment: $env${NC}"
            echo "Use: local, docker, or k8s"
            exit 1
            ;;
    esac
}

cmd_config() {
    local action=${1:-show}
    
    case "$action" in
        show)
            if [ -f ".env" ]; then
                cat .env | grep -v "^#" | grep -v "^$" | sort
            else
                echo -e "${YELLOW}No .env file found${NC}"
            fi
            ;;
        edit)
            ${EDITOR:-nano} .env
            ;;
        validate)
            echo -e "${BLUE}Validating configuration...${NC}"
            $NODE_CMD -e "
                const { ConfigManager } = require('./src/core/system/config-manager.cjs');
                const config = new ConfigManager();
                config.initialize().then(() => {
                    console.log('Configuration is valid');
                    console.log(JSON.stringify(config.getAll(), null, 2));
                }).catch(err => {
                    console.error('Configuration error:', err.message);
                    process.exit(1);
                });
            "
            ;;
        *)
            echo "Usage: ultra-dex-enhanced config [show|edit|validate]"
            ;;
    esac
}

cmd_logs() {
    if [ -f "logs/ultra-dex.log" ]; then
        tail -f logs/ultra-dex.log
    else
        echo -e "${YELLOW}No log file found${NC}"
    fi
}

cmd_backup() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_dir="backups/$timestamp"
    
    echo -e "${BLUE}Creating backup...${NC}"
    
    mkdir -p "$backup_dir"
    
    # Backup data
    if [ -d "data" ]; then
        tar -czf "$backup_dir/data.tar.gz" data/
    fi
    
    # Backup config
    if [ -f ".env" ]; then
        cp .env "$backup_dir/env.backup"
    fi
    
    # Create backup info
    cat > "$backup_dir/info.txt" << EOF
Ultra-Dex Backup
Date: $(date)
Version: 6.0.0
Files: data/, .env
EOF
    
    echo -e "${GREEN}✓ Backup created: $backup_dir${NC}"
}

cmd_restore() {
    local backup_dir=$1
    
    if [ -z "$backup_dir" ]; then
        # List available backups
        echo -e "${BLUE}Available backups:${NC}"
        ls -1t backups/ 2>/dev/null | head -10
        return
    fi
    
    if [ ! -d "backups/$backup_dir" ]; then
        echo -e "${RED}Backup not found: $backup_dir${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}WARNING: This will overwrite current data${NC}"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Restore data
        if [ -f "backups/$backup_dir/data.tar.gz" ]; then
            tar -xzf "backups/$backup_dir/data.tar.gz"
        fi
        
        # Restore config
        if [ -f "backups/$backup_dir/env.backup" ]; then
            cp "backups/$backup_dir/env.backup" .env
        fi
        
        echo -e "${GREEN}✓ Backup restored${NC}"
    fi
}

cmd_monitor() {
    echo -e "${BLUE}Starting monitoring dashboard...${NC}"
    
    $NODE_CMD -e "
        const { UltraDex } = require('./sdk.cjs');
        const ultra = new UltraDex();
        
        async function displayDashboard() {
            await ultra.initialize();
            
            console.clear();
            console.log('╔════════════════════════════════════════════════════════╗');
            console.log('║         Ultra-Dex Real-Time Monitoring                 ║');
            console.log('╚════════════════════════════════════════════════════════╝');
            console.log();
            
            const status = ultra.getStatus();
            console.log('Status:', status.status);
            console.log('Version:', status.version);
            console.log('Uptime:', Math.floor(status.uptime / 1000), 'seconds');
            console.log();
            
            const health = ultra.health();
            console.log('Health:', health.healthy ? '✅ Healthy' : '❌ Unhealthy');
            console.log();
            
            if (ultra.tokenOptimizer) {
                const stats = ultra.tokenOptimizer.getStats();
                console.log('Token Usage:');
                console.log('  Total tokens:', stats.totalTokens.toLocaleString());
                console.log('  Total cost: $', stats.totalCost.toFixed(2));
                console.log('  Today cost: $', stats.todayCost.toFixed(2));
                console.log('  Cache hit rate:', (stats.cacheHitRate * 100).toFixed(1) + '%');
                console.log();
            }
            
            const suggestions = ultra.tokenOptimizer?.getSuggestions();
            if (suggestions && suggestions.length > 0) {
                console.log('Optimization Suggestions:');
                suggestions.forEach(s => console.log('  •', s.message));
                console.log();
            }
            
            console.log('Press Ctrl+C to exit');
        }
        
        displayDashboard();
        
        // Refresh every 5 seconds
        setInterval(displayDashboard, 5000);
    "
}

cmd_optimize() {
    echo -e "${BLUE}Running optimization analysis...${NC}"
    
    $NODE_CMD -e "
        const { UltraDex } = require('./sdk.cjs');
        const ultra = new UltraDex();
        
        ultra.initialize().then(() => {
            console.log('╔════════════════════════════════════════════════════════╗');
            console.log('║         Ultra-Dex Optimization Report                  ║');
            console.log('╚════════════════════════════════════════════════════════╝');
            console.log();
            
            if (ultra.tokenOptimizer) {
                const suggestions = ultra.tokenOptimizer.getSuggestions();
                
                if (suggestions.length === 0) {
                    console.log('✅ No optimization suggestions at this time');
                } else {
                    console.log('Suggestions found:', suggestions.length);
                    console.log();
                    
                    suggestions.forEach((s, i) => {
                        console.log(\`\${i + 1}. [\${s.priority.toUpperCase()}] \${s.type}\`);
                        console.log('   ', s.message);
                        console.log('   Impact:', s.impact);
                        console.log();
                    });
                }
            }
            
            process.exit(0);
        }).catch(err => {
            console.error('Analysis failed:', err);
            process.exit(1);
        });
    "
}

cmd_version() {
    echo "Ultra-Dex v6.0.0"
    echo "AI Orchestration Meta-Layer"
    echo ""
    echo "Components:"
    echo "  - Unified Memory System"
    echo "  - Agent Registry & Orchestration"
    echo "  - MCP Server Manager (8 servers)"
    echo "  - Multi-Agent Coordination"
    echo "  - AI Provider Router"
    echo "  - Token Optimizer"
    echo "  - Observability System"
    echo "  - Configuration Manager"
    echo ""
    node --version
}

# Main command dispatcher
main() {
    local cmd=$1
    shift || true
    
    case "$cmd" in
        init)
            cmd_init "$@"
            ;;
        validate)
            cmd_validate
            ;;
        test)
            cmd_test
            ;;
        start)
            cmd_start
            ;;
        stop)
            cmd_stop
            ;;
        status)
            cmd_status
            ;;
        health)
            cmd_health
            ;;
        deploy)
            cmd_deploy "$@"
            ;;
        config)
            cmd_config "$@"
            ;;
        logs)
            cmd_logs
            ;;
        backup)
            cmd_backup
            ;;
        restore)
            cmd_restore "$@"
            ;;
        monitor)
            cmd_monitor
            ;;
        optimize)
            cmd_optimize
            ;;
        version|-v|--version)
            cmd_version
            ;;
        help|-h|--help|"")
            show_help
            ;;
        *)
            echo -e "${RED}Unknown command: $cmd${NC}"
            echo "Run 'ultra-dex-enhanced help' for usage"
            exit 1
            ;;
    esac
}

main "$@"
