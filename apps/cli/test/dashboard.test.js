import { afterEach, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  buildDashboardModel,
  executeQuickAction,
  generateDashboardHTML,
  getQuickActions,
  getRecentProjects,
  getSystemStatus,
  registerDashboardCommand,
  renderDashboardSnapshot,
  showInteractiveDashboard,
} from '../lib/commands/dashboard.js';

function createDashboardModel() {
  return {
    version: '6.0.0',
    generatedAt: '2026-03-27T00:00:00.000Z',
    currentProject: '/workspace/current-app',
    systemStatus: {
      projectName: 'current-app',
      cwd: '/workspace/current-app',
      health: 'healthy',
      git: {
        branch: 'main',
        lastCommit: 'abc123 feat: cycle 3',
        changedFiles: 2,
      },
      alignmentScore: 91,
      phases: {
        total: 4,
        completed: 2,
        inProgress: 1,
        pending: 1,
      },
      checks: [
        { label: 'package.json', status: 'ok' },
        { label: 'implementation plan', status: 'ok' },
      ],
      usage: {
        totalCommands: 12,
        last24h: 4,
        last7d: 9,
        errorCount: 1,
        topCommand: 'run',
        topCommands: [{ name: 'run', count: 4 }],
      },
      config: {
        theme: 'professional-purple',
        mcpPort: 3001,
        autoRefresh: true,
        refreshInterval: 30000,
      },
      runtime: {
        node: process.version,
        platform: `${process.platform}/${process.arch}`,
        uptimeSeconds: 1,
      },
    },
    recentProjects: [
      {
        name: 'current-app',
        path: '/workspace/current-app',
        source: 'current',
        lastSeenLabel: 'just now',
      },
    ],
    quickActions: [
      {
        id: 'run-agent',
        label: 'Run agent',
        description: 'Launch an agent task from the dashboard',
        command: 'ultra-dex run <agent> "<task>"',
        commandName: 'run',
      },
    ],
  };
}

describe('dashboard command', () => {
  let tmpDir;
  let homeDir;
  let historyPath;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-dashboard-test-'));
    homeDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ultra-dex-dashboard-home-'));
    historyPath = path.join(homeDir, '.ultra-dex', 'history.json');
    await fs.mkdir(path.dirname(historyPath), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
    await fs.rm(homeDir, { recursive: true, force: true });
  });

  test('getRecentProjects prioritizes the current project and de-duplicates history entries', async () => {
    const currentStateDir = path.join(tmpDir, '.ultra');
    const siblingProject = path.join(path.dirname(tmpDir), 'cycle-3-sibling');

    await fs.mkdir(currentStateDir, { recursive: true });
    await fs.writeFile(path.join(tmpDir, 'package.json'), '{"name":"current-app"}');
    await fs.writeFile(
      path.join(currentStateDir, 'state.json'),
      JSON.stringify({
        project: { name: 'current-app' },
        updatedAt: '2026-03-27T08:00:00.000Z',
      })
    );

    await fs.mkdir(path.join(siblingProject, '.git'), { recursive: true });
    await fs.writeFile(path.join(siblingProject, 'package.json'), '{"name":"sibling-app"}');
    await fs.writeFile(
      historyPath,
      JSON.stringify([
        { cwd: siblingProject, timestamp: '2026-03-26T08:00:00.000Z' },
        { cwd: tmpDir, timestamp: '2026-03-25T08:00:00.000Z' },
      ])
    );

    const projects = await getRecentProjects({
      cwd: tmpDir,
      homeDir,
      historyPath,
      candidateRoots: [path.dirname(tmpDir)],
      maxItems: 5,
      scanLimit: 5,
    });

    assert.equal(projects[0].path, tmpDir);
    assert.equal(projects[0].source, 'current');
    assert.ok(projects.some((project) => project.path === siblingProject));
    assert.equal(projects.filter((project) => project.path === tmpDir).length, 1);
  });

  test('getQuickActions ranks actions by recent usage', () => {
    const actions = getQuickActions({
      usageSummary: {
        topCommands: [
          { name: 'review', count: 7 },
          { name: 'run', count: 10 },
          { name: 'dashboard', count: 3 },
        ],
      },
    });

    assert.equal(actions[0].commandName, 'run');
    assert.ok(actions.some((action) => action.id === 'web-dashboard'));
  });

  test('getSystemStatus derives health, phase counts, and usage from project state', async () => {
    await fs.mkdir(path.join(tmpDir, '.ultra'), { recursive: true });
    await fs.writeFile(path.join(tmpDir, 'package.json'), '{"name":"status-app"}');
    await fs.writeFile(path.join(tmpDir, 'IMPLEMENTATION-PLAN.md'), '# Plan');
    await fs.writeFile(path.join(tmpDir, '.ultra', 'state.json'), '{}');

    const status = await getSystemStatus({
      cwd: tmpDir,
      getGitInfoImpl: () => ({
        branch: 'feature/cycle-3',
        lastCommit: 'def456 feat: dashboard',
        changedFiles: 4,
      }),
      loadStateImpl: async () => ({
        project: { name: 'status-app' },
        score: 88,
        phases: [
          { status: 'completed' },
          { status: 'in_progress' },
          { status: 'pending' },
        ],
      }),
      getUsageSummaryImpl: async () => ({
        totalCommands: 30,
        last24h: 6,
        last7d: 20,
        errorCount: 2,
        topCommands: [{ name: 'status', count: 5 }],
      }),
      loadConfigImpl: async () => ({
        theme: 'doomsday',
        mcpPort: 4004,
        autoRefresh: false,
        refreshInterval: 45000,
      }),
    });

    assert.equal(status.projectName, 'status-app');
    assert.equal(status.health, 'healthy');
    assert.equal(status.phases.completed, 1);
    assert.equal(status.phases.inProgress, 1);
    assert.equal(status.phases.pending, 1);
    assert.equal(status.usage.topCommand, 'status');
    assert.equal(status.config.theme, 'doomsday');
  });

  test('buildDashboardModel composes system status, recent projects, and actions', async () => {
    const model = await buildDashboardModel({
      cwd: tmpDir,
      getSystemStatusImpl: async () => createDashboardModel().systemStatus,
      getRecentProjectsImpl: async () => createDashboardModel().recentProjects,
      getQuickActionsImpl: () => createDashboardModel().quickActions,
    });

    assert.equal(model.systemStatus.projectName, 'current-app');
    assert.equal(model.recentProjects.length, 1);
    assert.equal(model.quickActions[0].id, 'run-agent');
  });

  test('renderDashboardSnapshot renders the current dashboard sections', () => {
    const snapshot = renderDashboardSnapshot(createDashboardModel(), { color: false });

    assert.match(snapshot, /Ultra-Dex Dashboard v6\.0\.0/);
    assert.match(snapshot, /System Status/);
    assert.match(snapshot, /Recent Projects/);
    assert.match(snapshot, /Quick Actions/);
  });

  test('showInteractiveDashboard returns a single snapshot when once is enabled', async () => {
    const logs = [];
    const model = await showInteractiveDashboard({
      cwd: tmpDir,
      once: true,
      clear: false,
      loading: false,
      log: (value) => logs.push(value),
      buildDashboardModelImpl: async () => createDashboardModel(),
    });

    assert.equal(model.systemStatus.projectName, 'current-app');
    assert.equal(logs.length, 1);
    assert.match(logs[0], /Quick Actions/);
  });

  test('executeQuickAction launches the selected command with prompted values', async () => {
    const calls = [];

    await executeQuickAction(
      {
        id: 'run-agent',
        label: 'Run agent',
      },
      {
        cwd: tmpDir,
        promptImpl: async () => ({
          agent: 'planner',
          task: 'repair the failing build',
        }),
        spawnImpl: (command, args, spawnOptions) => {
          calls.push({ command, args, spawnOptions });
          const child = new EventEmitter();
          process.nextTick(() => child.emit('close', 0));
          return child;
        },
      }
    );

    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0].args.slice(-3), ['run', 'planner', 'repair the failing build']);
    assert.equal(calls[0].spawnOptions.cwd, tmpDir);
  });

  test('generateDashboardHTML includes the current project name and usage details', () => {
    const html = generateDashboardHTML(
      {
        project: { name: 'html-app' },
        score: 96,
        phases: [{ name: 'Phase 1', status: 'completed' }],
      },
      {
        branch: 'main',
        lastCommit: 'abc123 feat: html',
        changedFiles: 1,
      },
      {
        nodes: 4,
        edges: 9,
      },
      {
        last24h: 8,
        last7d: 12,
        errorCount: 0,
        topCommands: [{ name: 'dashboard' }],
      }
    );

    assert.match(html, /html-app/);
    assert.match(html, /dashboard/i);
    assert.match(html, /Phase 1/);
  });

  test('registerDashboardCommand exposes the Cycle 3 dashboard options', () => {
    const program = {
      commands: [],
      command(name) {
        const command = {
          _name: name,
          _aliases: [],
          options: [],
          name() {
            return this._name;
          },
          alias(value) {
            this._aliases.push(value);
            return this;
          },
          aliases() {
            return [...this._aliases];
          },
          description() {
            return this;
          },
          option(flags) {
            this.options.push({ flags });
            return this;
          },
          action() {
            return this;
          },
        };

        this.commands.push(command);
        return command;
      },
    };
    registerDashboardCommand(program);

    const dashboardCommand = program.commands.find((command) => command.name() === 'dashboard');

    assert.ok(dashboardCommand);
    assert.ok(dashboardCommand.aliases().includes('d'));
    assert.ok(
      dashboardCommand.options.some((option) => option.flags.includes('--json')),
      'expected --json option'
    );
    assert.ok(
      dashboardCommand.options.some((option) => option.flags.includes('--once')),
      'expected --once option'
    );
    assert.ok(
      dashboardCommand.options.some((option) => option.flags.includes('--web')),
      'expected --web option'
    );
  });
});
