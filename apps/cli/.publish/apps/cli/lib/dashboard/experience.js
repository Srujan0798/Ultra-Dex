import fs from 'fs/promises';
import http from 'http';
import os from 'os';
import path from 'path';

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath, fallback = null) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function fromIsoLabel(value) {
  if (!value) return 'unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'unknown';
  const diffMs = Math.max(0, Date.now() - date.getTime());
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.round(diffHours / 24)}d ago`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function getCurrentProject(cwd) {
  const packageJsonPath = path.join(cwd, 'package.json');
  const state = await readJson(path.join(cwd, '.ultra', 'state.json'), {});
  const packageJson = await readJson(packageJsonPath, {});
  const projectName = state?.project?.name || packageJson?.name || path.basename(cwd);

  return {
    name: projectName,
    path: cwd,
    source: 'current',
    lastSeenLabel: 'just now',
  };
}

async function scanCandidateRoots(candidateRoots, limit) {
  const projects = [];

  for (const root of candidateRoots) {
    if (!(await pathExists(root))) continue;
    const entries = await fs.readdir(root, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const projectPath = path.join(root, entry.name);
      if (!(await pathExists(path.join(projectPath, 'package.json')))) continue;
      projects.push({
        name: entry.name,
        path: projectPath,
        source: 'scan',
        lastSeenLabel: 'discovered',
      });
      if (projects.length >= limit) return projects;
    }
  }

  return projects;
}

export async function getRecentProjects({
  cwd = process.cwd(),
  homeDir = os.homedir(),
  historyPath = path.join(homeDir, '.ultra-dex', 'history.json'),
  candidateRoots = [path.dirname(cwd)],
  maxItems = 5,
} = {}) {
  const projects = [];
  const seen = new Set();

  const pushProject = (project) => {
    if (!project?.path || seen.has(project.path)) return;
    seen.add(project.path);
    projects.push(project);
  };

  pushProject(await getCurrentProject(cwd));

  const historyEntries = await readJson(historyPath, []);
  for (const entry of historyEntries) {
    if (!(await pathExists(entry.cwd))) continue;
    pushProject({
      name: path.basename(entry.cwd),
      path: entry.cwd,
      source: 'history',
      lastSeenLabel: fromIsoLabel(entry.timestamp),
    });
    if (projects.length >= maxItems) return projects.slice(0, maxItems);
  }

  const scannedProjects = await scanCandidateRoots(candidateRoots, maxItems);
  scannedProjects.forEach(pushProject);

  return projects.slice(0, maxItems);
}

function summarizePhases(state) {
  const phases = Array.isArray(state?.phases) ? state.phases : [];
  return {
    total: phases.length,
    completed: phases.filter((phase) => phase.status === 'completed').length,
    inProgress: phases.filter((phase) => phase.status === 'in_progress').length,
    pending: phases.filter((phase) => phase.status === 'pending').length,
  };
}

async function defaultGitInfo() {
  return {
    branch: 'unknown',
    lastCommit: 'N/A',
    changedFiles: 0,
  };
}

async function defaultUsageSummary() {
  return {
    totalCommands: 0,
    last24h: 0,
    last7d: 0,
    errorCount: 0,
    topCommands: [],
  };
}

async function defaultConfig() {
  return {
    theme: 'default',
    mcpPort: 3001,
    autoRefresh: true,
    refreshInterval: 30000,
  };
}

export async function getSystemStatus({
  cwd = process.cwd(),
  getGitInfoImpl = defaultGitInfo,
  getUsageSummaryImpl = defaultUsageSummary,
  loadConfigImpl = defaultConfig,
} = {}) {
  const state = await readJson(path.join(cwd, '.ultra', 'state.json'), {});
  const git = await getGitInfoImpl({ cwd });
  const usage = await getUsageSummaryImpl({ cwd });
  const config = await loadConfigImpl({ cwd });
  const projectName = state?.project?.name || path.basename(cwd);
  const checks = [
    {
      label: 'package.json',
      status: (await pathExists(path.join(cwd, 'package.json'))) ? 'ok' : 'missing',
    },
  ];

  return {
    projectName,
    cwd,
    health: usage.errorCount > 3 ? 'degraded' : 'healthy',
    alignmentScore: state?.score ?? 0,
    phases: summarizePhases(state),
    git,
    usage: {
      ...usage,
      topCommand: usage.topCommands?.[0]?.name || null,
    },
    config,
    checks,
  };
}

function getQuickActions() {
  return [
    {
      id: 'status',
      label: 'Project status',
      description: 'Inspect the current project state',
      command: 'ultra-dex status',
    },
    {
      id: 'review',
      label: 'Review code',
      description: 'Run the review workflow',
      command: 'ultra-dex review',
    },
  ];
}

export async function buildDashboardModel({ cwd = process.cwd() } = {}) {
  return {
    version: '2.0.0',
    systemStatus: await getSystemStatus({ cwd }),
    recentProjects: await getRecentProjects({ cwd }),
    quickActions: getQuickActions(),
  };
}

export async function showInteractiveDashboard({
  cwd = process.cwd(),
  promptImpl = async () => ({ selection: { type: 'exit' } }),
  buildDashboardModelImpl = buildDashboardModel,
  executeQuickActionImpl = async () => {},
} = {}) {
  let currentCwd = cwd;

  while (true) {
    const model = await buildDashboardModelImpl({ cwd: currentCwd });
    const response = await promptImpl(model);
    const selection = response?.selection;

    if (!selection || selection.type === 'exit') {
      return { cwd: currentCwd, model };
    }

    if (selection.type === 'project' && selection.project?.path) {
      currentCwd = selection.project.path;
      continue;
    }

    if (selection.type === 'action' && selection.action) {
      await executeQuickActionImpl(selection.action, { cwd: currentCwd, model });
    }
  }
}

function renderDashboardHtml(model) {
  const projectItems = (model.recentProjects || [])
    .map(
      (project) =>
        `<li><strong>${escapeHtml(project.name)}</strong> <span>${escapeHtml(project.lastSeenLabel || '')}</span></li>`
    )
    .join('');
  const actionItems = (model.quickActions || [])
    .map(
      (action) =>
        `<li><strong>${escapeHtml(action.label)}</strong> <span>${escapeHtml(action.command || '')}</span></li>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ultra-Dex Dashboard</title>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(model.systemStatus?.projectName || 'Ultra-Dex')}</h1>
      <h2>Recent projects</h2>
      <ul>${projectItems}</ul>
      <h2>Quick actions</h2>
      <ul>${actionItems}</ul>
    </main>
  </body>
</html>`;
}

export async function startDashboardWebServer({
  port = 3001,
  quiet = false,
  buildDashboardModelImpl = buildDashboardModel,
} = {}) {
  const server = http.createServer(async (_req, res) => {
    const model = await buildDashboardModelImpl({ cwd: process.cwd() });
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderDashboardHtml(model));
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });

  if (!quiet) {
    process.stdout.write(`Dashboard listening on http://127.0.0.1:${port}\n`);
  }

  return {
    server,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      }),
  };
}

export default {
  buildDashboardModel,
  getRecentProjects,
  getSystemStatus,
  showInteractiveDashboard,
  startDashboardWebServer,
};
