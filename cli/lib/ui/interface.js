// Ultra-Dex CLI — Main Interface Display
// The startup screen and interactive interface

// import chalk from 'chalk';
import { theme, header, status, table, keyHints, statusLine } from './theme.js';

// ═══════════════════════════════════════════════════════════════
// STARTUP BANNER (Like Gemini CLI's clean intro)
// ═══════════════════════════════════════════════════════════════

const logo = `
  ██╗   ██╗██╗  ████████╗██████╗  █████╗ 
  ██║   ██║██║  ╚══██╔══╝██╔══██╗██╔══██╗
  ██║   ██║██║     ██║   ██████╔╝███████║
  ██║   ██║██║     ██║   ██╔══██╗██╔══██║
  ╚██████╔╝███████╗██║   ██║  ██║██║  ██║
   ╚═════╝ ╚══════╝╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝
                                  ██████╗ ███████╗██╗  ██╗
                                  ██╔══██╗██╔════╝╚██╗██╔╝
                                  ██║  ██║█████╗   ╚███╔╝ 
                                  ██║  ██║██╔══╝   ██╔██╗ 
                                  ██████╔╝███████╗██╔╝ ██╗
                                  ╚═════╝ ╚══════╝╚═╝  ╚═╝`;

export function showStartup(version = '3.1.0') {
    console.clear();
    console.log(theme.primary(logo));
    console.log('');
    console.log(theme.dim('  ─────────────────────────────────────────────────────────'));
    console.log(`  ${theme.title('ULTRA-DEX')} ${theme.dim('v' + version)} ${theme.dim('•')} ${theme.subtitle('AI Orchestration Meta-Layer')}`);
    console.log(theme.dim('  ─────────────────────────────────────────────────────────'));
    console.log('');
}

// ═══════════════════════════════════════════════════════════════
// MAIN INTERFACE (Interactive mode like Claude Code)
// ═══════════════════════════════════════════════════════════════

export function showMainInterface() {
    showStartup();

    console.log(theme.subtitle('  What would you like to do?'));
    console.log('');

    const options = [
        [theme.primary('1'), 'generate', 'Create implementation plan from idea'],
        [theme.primary('2'), 'build', 'Start AI-assisted development'],
        [theme.primary('3'), 'agents', 'Browse 16 specialized agents'],
        [theme.primary('4'), 'swarm', 'Run autonomous agent pipeline'],
        [theme.primary('5'), 'dashboard', 'Open monitoring dashboard'],
        [theme.primary('6'), 'serve', 'Start MCP server']
    ];

    options.forEach(([num, cmd, desc]) => {
        console.log(`  ${num}  ${theme.accent(cmd.padEnd(12))} ${theme.dim(desc)}`);
    });

    console.log('');
    keyHints([['q', 'quit'], ['h', 'help'], ['↑↓', 'navigate']]);
}

// ═══════════════════════════════════════════════════════════════
// STATUS DISPLAY (Like Gemini's project status view)
// ═══════════════════════════════════════════════════════════════

export function showStatus(projectData) {
    header('Project Status');
    console.log('');

    // Project info
    statusLine(status.info, theme.title(projectData.name || 'Ultra-Dex Project'));
    console.log('');

    // Alignment score with bar
    const score = projectData.score || 0;
    const _scoreColor = score >= 80 ? theme.success : score >= 50 ? theme.warning : theme.error;
    console.log(`  ${theme.dim('Alignment')}  ${progressBar(score, 100)}`);
    console.log('');

    // Quick stats
    table(['Metric', 'Value', 'Status'], [
        ['Sections Complete', `${projectData.sectionsComplete || 0}/34`, score >= 70 ? status.success : status.warning],
        ['Agents Ready', `${projectData.agentsReady || 16}/16`, status.success],
        ['Cursor Rules', `${projectData.rulesLoaded || 13}/13`, status.success],
        ['Last Updated', projectData.lastUpdated || 'Never', status.info]
    ]);

    console.log('');
}

// ═══════════════════════════════════════════════════════════════
// AGENTS LIST (Clean grid view)
// ═══════════════════════════════════════════════════════════════

export function showAgentsList() {
    header('Agents');
    console.log('');

    const agents = [
        {
            tier: '1-leadership', agents: [
                { name: 'cto', icon: '🏛️', status: 'ready' },
                { name: 'planner', icon: '📋', status: 'ready' },
                { name: 'research', icon: '🔍', status: 'ready' }
            ]
        },
        {
            tier: '2-development', agents: [
                { name: 'backend', icon: '⚙️', status: 'ready' },
                { name: 'frontend', icon: '🎨', status: 'ready' },
                { name: 'database', icon: '💾', status: 'ready' }
            ]
        },
        {
            tier: '3-security', agents: [
                { name: 'auth', icon: '🔐', status: 'ready' },
                { name: 'security', icon: '🛡️', status: 'ready' }
            ]
        },
        {
            tier: '4-devops', agents: [
                { name: 'devops', icon: '🚀', status: 'ready' }
            ]
        },
        {
            tier: '5-quality', agents: [
                { name: 'testing', icon: '🧪', status: 'ready' },
                { name: 'docs', icon: '📖', status: 'ready' },
                { name: 'reviewer', icon: '👀', status: 'ready' },
                { name: 'debugger', icon: '🐛', status: 'ready' }
            ]
        },
        {
            tier: '6-specialist', agents: [
                { name: 'performance', icon: '⚡', status: 'ready' },
                { name: 'refactoring', icon: '♻️', status: 'ready' }
            ]
        }
    ];

    agents.forEach(tier => {
        console.log(`  ${theme.dim(tier.tier)}`);
        tier.agents.forEach(agent => {
            const statusIcon = agent.status === 'ready' ? theme.success('●') : theme.dim('○');
            console.log(`    ${statusIcon} ${agent.icon} ${theme.accent(agent.name)}`);
        });
        console.log('');
    });

    keyHints([['enter', 'select'], ['q', 'back']]);
}

// ═══════════════════════════════════════════════════════════════
// SWARM MODE DISPLAY (Pipeline visualization)
// ═══════════════════════════════════════════════════════════════

export function showSwarmPipeline(task, agents, currentIdx = -1) {
    header('Agent Swarm');
    console.log('');
    console.log(`  ${theme.dim('Task:')} ${theme.title(task)}`);
    console.log('');

    agents.forEach((agent, idx) => {
        let icon, color;

        if (idx < currentIdx) {
            icon = status.success;
            color = theme.success;
        } else if (idx === currentIdx) {
            icon = status.running;
            color = theme.accent;
        } else {
            icon = status.pending;
            color = theme.dim;
        }

        const line = idx < agents.length - 1 ? theme.dim('│') : ' ';
        console.log(`  ${icon} ${color(agent.name)}`);
        console.log(`  ${line}`);
    });

    if (currentIdx >= agents.length) {
        console.log('');
        console.log(`  ${theme.success.bold('✓ Pipeline complete')}`);
    }

    console.log('');
}

// ═══════════════════════════════════════════════════════════════
// HELP DISPLAY
// ═══════════════════════════════════════════════════════════════

export function showHelp() {
    header('Commands');
    console.log('');

    const commands = [
        ['Getting Started', [
            ['init', 'Initialize new project'],
            ['generate <idea>', 'Create plan from idea'],
            ['doctor', 'Check project health']
        ]],
        ['AI Agents', [
            ['agents', 'List all agents'],
            ['run <agent>', 'Run specific agent'],
            ['swarm <task>', 'Run agent pipeline']
        ]],
        ['Monitoring', [
            ['status', 'Show project status'],
            ['dashboard', 'Open web dashboard'],
            ['watch', 'Watch for changes']
        ]],
        ['Integration', [
            ['serve', 'Start MCP server'],
            ['config --mcp', 'Generate MCP config'],
            ['hooks', 'Install git hooks']
        ]]
    ];

    commands.forEach(([section, cmds]) => {
        console.log(`  ${theme.subtitle(section)}`);
        cmds.forEach(([cmd, desc]) => {
            console.log(`    ${theme.accent(cmd.padEnd(18))} ${theme.dim(desc)}`);
        });
        console.log('');
    });
}

// ═══════════════════════════════════════════════════════════════
// EXPORT ALL
// ═══════════════════════════════════════════════════════════════

export default {
    showStartup,
    showMainInterface,
    showStatus,
    showAgentsList,
    showSwarmPipeline,
    showHelp
};
