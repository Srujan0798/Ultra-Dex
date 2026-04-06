import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, test } from 'node:test';
import fs from 'fs/promises';
import http from 'http';
import os from 'os';
import path from 'path';
import {
  getRecentProjects,
  getSystemStatus,
  showInteractiveDashboard,
  startDashboardWebServer,
} from '../../apps/cli/lib/dashboard/experience.js';

async function createProject(rootDir, name, options = {}) {
  const projectDir = path.join(rootDir, name);
  await fs.mkdir(projectDir, { recursive: true });

  if (options.packageJson !== false) {
    await fs.writeFile(
      path.join(projectDir, 'package.json'),
      JSON.stringify({ name, version: '1.0.0', type: 'module' }, null, 2)
    );
  }

  if (options.plan) {
    await fs.writeFile(path.join(projectDir, 'IMPLEMENTATION-PLAN.md'), options.plan);
  }

  if (options.git !== false) {
    await fs.mkdir(path.join(projectDir, '.git'), { recursive: true });
  }

  if (options.state) {
    await fs.mkdir(path.join(projectDir, '.ultra'), { recursive: true });
    await fs.writeFile(
      path.join(projectDir, '.ultra', 'state.json'),
      JSON.stringify(options.state, null, 2)
    );
  }

  return projectDir;
}

describe('CLI Command: dashboard', () => {
  let tempRoot;

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-dashboard-'));
  });

  afterEach(async () => {
    if (tempRoot) {
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  });

  test('getRecentProjects prioritizes current project and recent history', async () => {
    const workspaceRoot = path.join(tempRoot, 'workspace');
    const homeDir = path.join(tempRoot, 'home');
    const historyPath = path.join(homeDir, '.ultra-dex', 'history.json');

    await fs.mkdir(workspaceRoot, { recursive: true });
    await fs.mkdir(path.dirname(historyPath), { recursive: true });

    const currentProject = await createProject(workspaceRoot, 'current-app', {
      state: {
        project: { name: 'current-app' },
        score: 92,
        updatedAt: '2026-03-27T10:00:00.000Z',
      },
    });
    const alphaProject = await createProject(workspaceRoot, 'alpha-app');
    const betaProject = await createProject(workspaceRoot, 'beta-app');

    await fs.writeFile(
      historyPath,
      JSON.stringify(
        [
          { cwd: alphaProject, timestamp: '2026-03-27T09:00:00.000Z' },
          { cwd: betaProject, timestamp: '2026-03-26T09:00:00.000Z' },
        ],
        null,
        2
      )
    );

    const projects = await getRecentProjects({
      cwd: currentProject,
      homeDir,
      historyPath,
      candidateRoots: [workspaceRoot],
      maxItems: 3,
    });

    assert.equal(projects.length, 3);
    assert.equal(projects[0].path, currentProject);
    assert.equal(projects[0].source, 'current');
    assert.deepEqual(
      new Set(projects.slice(1).map((project) => project.path)),
      new Set([alphaProject, betaProject])
    );
  });

  test('getSystemStatus returns project, usage, and config summary', async () => {
    const projectDir = await createProject(tempRoot, 'status-app', {
      plan: '## Phase 1\n- [x] Ship dashboard\n## Phase 2\n- [ ] Add tests\n',
      state: {
        project: { name: 'status-app' },
        score: 88,
        phases: [
          { name: 'Phase 1', status: 'completed', steps: [] },
          { name: 'Phase 2', status: 'in_progress', steps: [] },
        ],
      },
    });

    const status = await getSystemStatus({
      cwd: projectDir,
      getGitInfoImpl: () => ({
        branch: 'main',
        lastCommit: 'abc123 dashboard',
        changedFiles: 2,
      }),
      getUsageSummaryImpl: () => ({
        totalCommands: 14,
        last24h: 4,
        last7d: 11,
        errorCount: 1,
        topCommands: [{ name: 'review', count: 3 }],
      }),
      loadConfigImpl: () => ({
        theme: 'aurora',
        mcpPort: 4100,
        autoRefresh: false,
        refreshInterval: 60000,
      }),
    });

    assert.equal(status.projectName, 'status-app');
    assert.equal(status.health, 'healthy');
    assert.equal(status.alignmentScore, 88);
    assert.deepEqual(status.phases, {
      total: 2,
      completed: 1,
      inProgress: 1,
      pending: 0,
    });
    assert.equal(status.git.branch, 'main');
    assert.equal(status.usage.topCommand, 'review');
    assert.equal(status.config.theme, 'aurora');
    assert.equal(status.config.mcpPort, 4100);
  });

  test('showInteractiveDashboard switches project context and dispatches quick actions', async () => {
    const currentProject = path.join(tempRoot, 'current-app');
    const otherProject = path.join(tempRoot, 'other-app');
    const buildCalls = [];
    const executed = [];
    const prompts = [
      {
        selection: {
          type: 'project',
          project: {
            name: 'other-app',
            path: otherProject,
            source: 'history',
            lastSeenLabel: '1h ago',
          },
        },
      },
      {
        selection: {
          type: 'action',
          action: {
            id: 'status',
            label: 'Project status',
            description: 'Inspect the current project state',
            command: 'ultra-dex status',
          },
        },
      },
      {
        selection: { type: 'exit' },
      },
    ];

    await showInteractiveDashboard({
      cwd: currentProject,
      color: false,
      clear: false,
      log: () => {},
      promptImpl: async () => prompts.shift(),
      buildDashboardModelImpl: async ({ cwd }) => {
        buildCalls.push(cwd);
        return {
          version: '6.0.0',
          systemStatus: {
            projectName: path.basename(cwd),
            cwd,
            health: 'healthy',
            git: { branch: 'main', changedFiles: 0 },
            alignmentScore: 80,
            phases: { total: 1, completed: 1, inProgress: 0, pending: 0 },
            usage: { last24h: 1, errorCount: 0 },
            config: { theme: 'aurora', mcpPort: 3001 },
          },
          recentProjects: [
            {
              name: 'other-app',
              path: otherProject,
              source: 'history',
              lastSeenLabel: '1h ago',
            },
          ],
          quickActions: [
            {
              id: 'status',
              label: 'Project status',
              description: 'Inspect the current project state',
              command: 'ultra-dex status',
            },
          ],
        };
      },
      executeQuickActionImpl: async (action, context) => {
        executed.push({ actionId: action.id, cwd: context.cwd });
      },
    });

    assert.deepEqual(buildCalls, [currentProject, otherProject, otherProject]);
    assert.deepEqual(executed, [{ actionId: 'status', cwd: otherProject }]);
  });

  test('startDashboardWebServer serves dashboard HTML', async () => {
    const port = 41000 + Math.floor(Math.random() * 1000);
    const dashboard = await startDashboardWebServer({
      port,
      quiet: true,
      buildDashboardModelImpl: async () => ({
        version: '6.0.0',
        systemStatus: {
          projectName: 'web-app',
          cwd: '/tmp/web-app',
          health: 'healthy',
          git: { branch: 'main', changedFiles: 0 },
          alignmentScore: 95,
          phases: { total: 2, completed: 2, inProgress: 0, pending: 0 },
          usage: { last24h: 2, errorCount: 0 },
          config: { theme: 'aurora', mcpPort: 3001 },
          checks: [{ label: 'package.json', status: 'ok' }],
        },
        recentProjects: [
          {
            name: 'web-app',
            path: '/tmp/web-app',
            source: 'current',
            lastSeenLabel: 'just now',
          },
        ],
        quickActions: [
          {
            id: 'status',
            label: 'Project status',
            description: 'Inspect the current project state',
            command: 'ultra-dex status',
          },
        ],
      }),
    });

    const body = await new Promise((resolve, reject) => {
      http
        .get(`http://127.0.0.1:${port}`, (response) => {
          let data = '';
          response.setEncoding('utf8');
          response.on('data', (chunk) => {
            data += chunk;
          });
          response.on('end', () => resolve(data));
        })
        .on('error', reject);
    });

    assert.match(body, /Recent projects/i);
    assert.match(body, /Quick actions/i);
    assert.match(body, /web-app/i);

    await dashboard.close();
    assert.equal(dashboard.server.listening, false);
  });
});
