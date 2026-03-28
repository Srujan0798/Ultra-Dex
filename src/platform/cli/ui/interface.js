// Copyright (c) 2026 Ultra-Dex

// Ultra-Dex CLI — Main Interface Display
// The startup screen and interactive interface

import { theme, header, status, table, keyHints, statusLine, progressBar } from './theme.js';
import { VERSION } from '../utils/version.js';

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

export function showStartup(version = VERSION) {
  console.clear();
  logger.log(theme.primary(logo));
  logger.log('');
  logger.log(theme.dim('  ─────────────────────────────────────────────────────────'));
  logger.log(
    `  ${theme.title('ULTRA-DEX')} ${theme.dim('v' + version)} ${theme.dim('•')} ${theme.subtitle('AI Orchestration Meta-Layer')}`
  );
  logger.log(theme.dim('  ─────────────────────────────────────────────────────────'));
  logger.log('');
}

// ═══════════════════════════════════════════════════════════════
// MAIN INTERFACE (Interactive mode like Claude Code)
// ═══════════════════════════════════════════════════════════════

export function showMainInterface() {
  showStartup();

  logger.log(theme.subtitle('  What would you like to do?'));
  logger.log('');

  const options = [
    [theme.primary('1'), 'generate', 'Create implementation plan from idea'],
    [theme.primary('2'), 'build', 'Start AI-assisted development'],
    [theme.primary('3'), 'agents', 'Browse 16 specialized agents'],
    [theme.primary('4'), 'swarm', 'Run autonomous agent pipeline'],
    [theme.primary('5'), 'dashboard', 'Open monitoring dashboard'],
    [theme.primary('6'), 'serve', 'Start MCP server'],
  ];

  options.forEach(([num, cmd, desc]) => {
    logger.log(`  ${num}  ${theme.accent(cmd.padEnd(12))} ${theme.dim(desc)}`);
  });

  logger.log('');
  keyHints([
    ['q', 'quit'],
    ['h', 'help'],
    ['↑↓', 'navigate'],
  ]);
}

// ═══════════════════════════════════════════════════════════════
// STATUS DISPLAY (Like Gemini's project status view)
// ═══════════════════════════════════════════════════════════════

export function showStatus(projectData) {
  header('Project Status');
  logger.log('');

  // Project info
  statusLine(status.info, theme.title(projectData.name || 'Ultra-Dex Project'));
  logger.log('');

  // Alignment score with bar
  const score = projectData.score || 0;
  const _scoreColor = score >= 80 ? theme.success : score >= 50 ? theme.warning : theme.error;
  logger.log(`  ${theme.dim('Alignment')}  ${progressBar(score, 100)}`);
  logger.log('');

  // Quick stats
  table(
    ['Metric', 'Value', 'Status'],
    [
      [
        'Sections Complete',
        `${projectData.sectionsComplete || 0}/34`,
        score >= 70 ? status.success : status.warning,
      ],
      ['Agents Ready', `${projectData.agentsReady || 16}/16`, status.success],
      ['Cursor Rules', `${projectData.rulesLoaded || 13}/13`, status.success],
      ['Last Updated', projectData.lastUpdated || 'Never', status.info],
    ]
  );

  logger.log('');
}

// ═══════════════════════════════════════════════════════════════
// AGENTS LIST (Clean grid view)
// ═══════════════════════════════════════════════════════════════

export function showAgentsList() {
  header('Agents');
  logger.log('');

  const agents = [
    {
      tier: '1-leadership',
      agents: [
        { name: 'cto', icon: '🏛️', status: 'ready' },
        { name: 'planner', icon: '📋', status: 'ready' },
        { name: 'research', icon: '🔍', status: 'ready' },
      ],
    },
    {
      tier: '2-development',
      agents: [
        { name: 'backend', icon: '⚙️', status: 'ready' },
        { name: 'frontend', icon: '🎨', status: 'ready' },
        { name: 'database', icon: '💾', status: 'ready' },
      ],
    },
    {
      tier: '3-security',
      agents: [
        { name: 'auth', icon: '🔐', status: 'ready' },
        { name: 'security', icon: '🛡️', status: 'ready' },
      ],
    },
    {
      tier: '4-devops',
      agents: [{ name: 'devops', icon: '🚀', status: 'ready' }],
    },
    {
      tier: '5-quality',
      agents: [
        { name: 'testing', icon: '🧪', status: 'ready' },
        { name: 'docs', icon: '📖', status: 'ready' },
        { name: 'reviewer', icon: '👀', status: 'ready' },
        { name: 'debugger', icon: '🐛', status: 'ready' },
      ],
    },
    {
      tier: '6-specialist',
      agents: [
        { name: 'performance', icon: '⚡', status: 'ready' },
        { name: 'refactoring', icon: '♻️', status: 'ready' },
      ],
    },
  ];

  agents.forEach((tier) => {
    logger.log(`  ${theme.dim(tier.tier)}`);
    tier.agents.forEach((agent) => {
      const statusIcon = agent.status === 'ready' ? theme.success('●') : theme.dim('○');
      logger.log(`    ${statusIcon} ${agent.icon} ${theme.accent(agent.name)}`);
    });
    logger.log('');
  });

  keyHints([
    ['enter', 'select'],
    ['q', 'back'],
  ]);
}

// ═══════════════════════════════════════════════════════════════
// SWARM MODE DISPLAY (Pipeline visualization)
// ═══════════════════════════════════════════════════════════════

export function showSwarmPipeline(task, agents, currentIdx = -1) {
  header('Agent Swarm');
  logger.log('');
  logger.log(`  ${theme.dim('Task:')} ${theme.title(task)}`);
  logger.log('');

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
    logger.log(`  ${icon} ${color(agent.name)}`);
    logger.log(`  ${line}`);
  });

  if (currentIdx >= agents.length) {
    logger.log('');
    logger.log(`  ${theme.success.bold('✓ Pipeline complete')}`);
  }

  logger.log('');
}

// ═══════════════════════════════════════════════════════════════
// HELP DISPLAY
// ═══════════════════════════════════════════════════════════════

export function showHelp() {
  header('Commands');
  logger.log('');

  const commands = [
    [
      'Getting Started',
      [
        ['init', 'Initialize new project'],
        ['generate <idea>', 'Create plan from idea'],
        ['doctor', 'Check project health'],
      ],
    ],
    [
      'AI Agents',
      [
        ['agents', 'List all agents'],
        ['run <agent>', 'Run specific agent'],
        ['swarm <task>', 'Run agent pipeline'],
      ],
    ],
    [
      'Monitoring',
      [
        ['status', 'Show project status'],
        ['dashboard', 'Open web dashboard'],
        ['watch', 'Watch for changes'],
      ],
    ],
    [
      'Integration',
      [
        ['serve', 'Start MCP server'],
        ['config --mcp', 'Generate MCP config'],
        ['hooks', 'Install git hooks'],
      ],
    ],
  ];

  commands.forEach(([section, cmds]) => {
    logger.log(`  ${theme.subtitle(section)}`);
    cmds.forEach(([cmd, desc]) => {
      logger.log(`    ${theme.accent(cmd.padEnd(18))} ${theme.dim(desc)}`);
    });
    logger.log('');
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
  showHelp,
};

/**
 * Handle errors in interface module
 * @param {Error} error - The error to handle
 * @param {string} [context='interface'] - Error context
 */
function handleModuleError(error, context = 'interface') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
