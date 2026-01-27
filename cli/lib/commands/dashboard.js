/**
 * ultra-dex dashboard command
 * Local web dashboard for monitoring Ultra-Dex projects (GOD MODE)
 */

import chalk from 'chalk';
import http from 'http';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { loadState } from './plan.js';

async function getGitInfo() {
  try {
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    const lastCommit = execSync('git log -1 --format="%h %s" 2>/dev/null', { encoding: 'utf8' }).trim();
    const status = execSync('git status --porcelain 2>/dev/null', { encoding: 'utf8' });
    const changedFiles = status.split('\n').filter(l => l.trim()).length;
    return { branch, lastCommit, changedFiles };
  } catch {
    return { branch: 'unknown', lastCommit: 'N/A', changedFiles: 0 };
  }
}

function generateDashboardHTML(state, gitInfo, graphInfo) {

  const phasesHTML = state.phases.map(phase => {

    const statusClass = phase.status;

    const progress = (phase.steps.filter(s => s.status === 'completed').length / phase.steps.length) * 100;

    

    return `

      <div class="card phase-card ${statusClass}">

        <div class="phase-header">

            <h3>${phase.name}</h3>

            <span class="status-badge">${phase.status.replace('_', ' ')}</span>

        </div>

        <div class="progress-mini"><div class="fill" style="width: ${progress}%"></div></div>

        <ul class="steps">

          ${phase.steps.map(step => `

            <li class="${step.status}">

              <span class="dot"></span>

              ${step.task}

            </li>

          `).join('')}

        </ul>

      </div>

    `;

  }).join('');



  const agentsHTML = state.agents.registry.map(agent => `

    <div class="agent-pill ${state.agents.active.includes(agent) ? 'active' : ''}">

      @${agent}

    </div>

  `).join('');



  return `<!DOCTYPE html>

<html lang="en">

<head>

  <meta charset="UTF-8">

  <title>ULTRA-DEX KERNEL • ${state.project.name}</title>

  <meta http-equiv="refresh" content="5">

  <style>

    :root {

      --bg: #09090b;

      --card: #18181b;

      --accent: #06b6d4;

      --text: #fafafa;

      --text-dim: #a1a1aa;

      --success: #22c55e;

      --warning: #eab308;

      --pending: #3f3f46;

    }

    * { margin:0; padding:0; box-sizing:border-box; }

    body {

      background: var(--bg);

      color: var(--text);

      font-family: 'Inter', system-ui, sans-serif;

      padding: 2rem;

      line-height: 1.5;

    }

    .container { max-width: 1400px; margin: 0 auto; }

    .header { margin-bottom: 3rem; border-left: 4px solid var(--accent); padding-left: 1.5rem; display: flex; justify-content: space-between; align-items: flex-end; }

    .header h1 { font-size: 2.5rem; letter-spacing: -0.05em; text-transform: uppercase; }

    .header p { color: var(--text-dim); font-family: monospace; }



    .stats-bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem; }

    .stat-card { background: var(--card); border: 1px solid #27272a; padding: 1rem; border-radius: 0.5rem; }

    .stat-card label { font-size: 0.7rem; color: var(--text-dim); text-transform: uppercase; }

    .stat-card div { font-size: 1.5rem; font-weight: bold; color: var(--accent); }



    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 1.5rem; }

    

    .card {

      background: var(--card);

      border: 1px solid #27272a;

      border-radius: 0.75rem;

      padding: 1.5rem;

      position: relative;

      overflow: hidden;

    }



    .phase-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }

    .status-badge { font-size: 0.65rem; text-transform: uppercase; background: #27272a; padding: 2px 8px; border-radius: 4px; color: var(--text-dim); }

    

    .phase-card.completed { border-color: var(--success); }

    .phase-card.completed .status-badge { color: var(--success); border: 1px solid var(--success); }

    .phase-card.in_progress { border-color: var(--accent); }

    .phase-card.in_progress .status-badge { color: var(--accent); border: 1px solid var(--accent); }



    .progress-mini { height: 4px; background: #27272a; border-radius: 2px; margin-bottom: 1.5rem; }

    .progress-mini .fill { height: 100%; background: var(--accent); border-radius: 2px; }



    .steps { list-style: none; }

    .steps li { font-size: 0.9rem; color: var(--text-dim); margin-bottom: 0.75rem; display: flex; align-items: center; }

    .steps li.completed { color: var(--text); }

    .steps li.completed .dot { background: var(--success); box-shadow: 0 0 8px var(--success); }

    .steps li .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--pending); margin-right: 12px; }



    .agent-grid { margin-top: 2rem; display: flex; gap: 0.5rem; flex-wrap: wrap; }

    .agent-pill { 

        background: #27272a; padding: 4px 12px; border-radius: 99px; font-size: 0.8rem; font-family: monospace; color: var(--text-dim);

        border: 1px solid transparent;

    }

    .agent-pill.active { background: rgba(6, 182, 212, 0.1); border-color: var(--accent); color: var(--accent); }



    .git-panel { margin-top: 3rem; padding: 1rem; background: #000; border-radius: 0.5rem; font-family: monospace; font-size: 0.8rem; color: #22c55e; }

    

    .glitch { position: absolute; top:0; right:0; padding: 0.5rem; font-size: 0.7rem; color: #333; }

  </style>

</head>

<body>

  <div class="container">

    <div class="header">

        <div>

            <h1>${state.project.name} <small style="font-size: 0.4em; vertical-align: middle; color: var(--accent)">GOD MODE</small></h1>

            <p>KERNEL v${state.project.version} • LOCALHOST • ${new Date().toLocaleTimeString()}</p>

        </div>

        <div style="text-align: right">

            <p style="color: var(--success)">● SYSTEM ONLINE</p>

            <p style="font-size: 0.7rem">NODE: ${process.version}</p>

        </div>

    </div>



    <div class="stats-bar">

        <div class="stat-card">

            <label>Brain (CPG Nodes)</label>

            <div>${graphInfo.nodes}</div>

        </div>

        <div class="stat-card">

            <label>Connections (Edges)</label>

            <div>${graphInfo.edges}</div>

        </div>

        <div class="stat-card">

            <label>Alignment</label>

            <div>${state.project.alignment || 0}%</div>

        </div>

        <div class="stat-card">

            <label>Git Branch</label>

            <div>${gitInfo.branch}</div>

        </div>

    </div>



    <div class="grid">

        ${phasesHTML}

    </div>



    <div class="agent-grid">

        <span style="color: var(--text-dim); font-size: 0.8rem; margin-right: 1rem; align-self: center">AGENT REGISTRY:</span>

        ${agentsHTML}

    </div>



    <div class="git-panel">

        > git status: ${gitInfo.changedFiles} files pending

        <br>> last_commit: ${gitInfo.lastCommit}

        <br>> graph_last_sync: ${graphInfo.lastUpdated}

        <br>> memory_moat: CodePropertyGraph_Active

    </div>

  </div>



  <div class="glitch">SECURE_PROTOCOL_ACTIVE</div>

</body>

</html>`;

}



export function registerDashboardCommand(program) {

  program

    .command('dashboard')

    .description('Start the Ultra-Dex JARVIS Dashboard')

    .option('-p, --port <port>', 'Port to listen on', '3002')

    .action(async (options) => {

      const port = parseInt(options.port);

      const { buildGraph } = await import('../utils/graph.js');

      

      console.log(chalk.bold.cyan('\n🖥️  Starting God Mode Dashboard...'));

      

      const server = http.createServer(async (req, res) => {

        try {

            const state = await loadState();

            const gitInfo = await getGitInfo();

            const graph = await buildGraph();

            const graphInfo = {

                nodes: graph.nodes.length,

                edges: graph.edges.length,

                lastUpdated: graph.lastUpdated

            };

            const html = generateDashboardHTML(state, gitInfo, graphInfo);

            res.writeHead(200, { 'Content-Type': 'text/html' });

            res.end(html);

        } catch (e) {

            res.writeHead(500);

            res.end(`Error: ${e.message}`);

        }

      });



      server.listen(port, () => {

        console.log(chalk.green(`✅ Dashboard active at http://localhost:${port}`));

      });

    });

}
