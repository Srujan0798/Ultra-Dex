#!/usr/bin/env node
/**
 * Ultra Orchestrator
 * Automated execution system for Ultra-Dex V2.0 Hard Reset
 * 
 * Usage:
 *   npm run ultra:start    - Start orchestration
 *   npm run ultra:status   - Check status
 *   npm run ultra:pause    - Pause execution
 *   npm run ultra:resume   - Resume execution
 *   npm run ultra:stop     - Stop execution
 *   npm run ultra:report   - Generate report
 */

import fs from 'fs';
import path from 'path';
import { execSync, spawn } from 'child_process';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const CONFIG = {
  stateDir: '.protocol/state',
  progressFile: '.protocol/state/PROGRESS.md',
  dispatchPattern: 'v20-phase{digit}-dispatches.md',
  totalPhases: 13, // 0-12
  totalWindows: 52,
  logDir: '.ultra-dex/logs',
  reportDir: '.ultra-dex/reports',
  configFile: '.ultra-dex/orchestrator-config.json',
};

// ─────────────────────────────────────────────────────────────────────────────
// STATE MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

class StateManager {
  constructor() {
    this.state = this.loadState();
  }

  loadState() {
    const statePath = path.join(CONFIG.logDir, 'orchestrator-state.json');
    if (fs.existsSync(statePath)) {
      return JSON.parse(fs.readFileSync(statePath, 'utf-8'));
    }
    return {
      status: 'idle', // idle, running, paused, stopped
      currentPhase: 0,
      currentWindow: null,
      completedWindows: [],
      failedWindows: [],
      skippedWindows: [],
      costs: {},
      startTime: null,
      pauseTime: null,
      gates: {},
    };
  }

  saveState() {
    const statePath = path.join(CONFIG.logDir, 'orchestrator-state.json');
    if (!fs.existsSync(CONFIG.logDir)) {
      fs.mkdirSync(CONFIG.logDir, { recursive: true });
    }
    fs.writeFileSync(statePath, JSON.stringify(this.state, null, 2));
  }

  getStatus() {
    return this.state.status;
  }

  setStatus(status) {
    this.state.status = status;
    this.saveState();
  }

  markWindowComplete(phase, window, cost = 0) {
    const windowId = `P${phase}-W${window}`;
    if (!this.state.completedWindows.includes(windowId)) {
      this.state.completedWindows.push(windowId);
    }
    this.state.costs[windowId] = cost;
    this.saveState();
    this.updateProgressFile(phase, window, 'DONE', cost);
  }

  markWindowFailed(phase, window) {
    const windowId = `P${phase}-W${window}`;
    if (!this.state.failedWindows.includes(windowId)) {
      this.state.failedWindows.push(windowId);
    }
    this.saveState();
    this.updateProgressFile(phase, window, 'FAILED');
  }

  markWindowRunning(phase, window, agent) {
    this.state.currentPhase = phase;
    this.state.currentWindow = { phase, window, agent, startTime: new Date().toISOString() };
    this.saveState();
    this.updateProgressFile(phase, window, 'RUNNING', 0, agent);
  }

  updateProgressFile(phase, window, status, cost = 0, agent = '-') {
    // Read current progress
    if (!fs.existsSync(CONFIG.progressFile)) return;
    
    let progress = fs.readFileSync(CONFIG.progressFile, 'utf-8');
    
    // Update window status in table
    const windowPattern = new RegExp(`\\| W${window} \\| [^|]+ \\|`);
    const timestamp = new Date().toISOString().split('T')[0];
    
    let statusIcon;
    switch(status) {
      case 'DONE': statusIcon = '✅ DONE'; break;
      case 'RUNNING': statusIcon = '🔄 RUNNING'; break;
      case 'FAILED': statusIcon = '❌ FAILED'; break;
      default: statusIcon = '⏳ PENDING';
    }
    
    // Simple regex replacement for the window row
    // This is a basic implementation - could be more robust
    const newRow = `| W${window} | ${statusIcon} | ${agent} | ${status === 'RUNNING' ? timestamp : '-'} | ${status === 'DONE' ? timestamp : '-'} | ${cost || '-'} |`;
    
    // Find and replace the line
    const lines = progress.split('\n');
    const updatedLines = lines.map(line => {
      if (line.includes(`| W${window} |`)) {
        // Preserve the description at the end
        const descMatch = line.match(/\|[^|]+\|[^|]+\|[^|]+\|[^|]+\|[^|]+\|[^|]+\|(.+)$/);
        const desc = descMatch ? descMatch[1] : '';
        return `${newRow}${desc}`;
      }
      return line;
    });
    
    fs.writeFileSync(CONFIG.progressFile, updatedLines.join('\n'));
  }

  getProgress() {
    const total = CONFIG.totalWindows;
    const completed = this.state.completedWindows.length;
    const failed = this.state.failedWindows.length;
    const percent = Math.round((completed / total) * 100);
    
    return {
      total,
      completed,
      failed,
      percent,
      current: this.state.currentWindow,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// DISPATCH PARSER
// ─────────────────────────────────────────────────────────────────────────────

class DispatchParser {
  constructor() {
    this.dispatches = new Map();
  }

  loadPhase(phaseNum) {
    const filename = `v20-phase${phaseNum}-dispatches.md`;
    const filepath = path.join(CONFIG.stateDir, filename);
    
    if (!fs.existsSync(filepath)) {
      return null;
    }
    
    const content = fs.readFileSync(filepath, 'utf-8');
    return this.parseDispatch(content, phaseNum);
  }

  parseDispatch(content, phaseNum) {
    const windows = [];
    const sections = content.split('#### W');
    
    for (let i = 1; i < sections.length; i++) {
      const section = '#### W' + sections[i];
      const window = this.parseWindow(section, phaseNum);
      if (window) {
        windows.push(window);
      }
    }
    
    return { phase: phaseNum, windows };
  }

  parseWindow(section, phaseNum) {
    // Extract window number
    const numMatch = section.match(/W(\d+):/);
    if (!numMatch) return null;
    const windowNum = parseInt(numMatch[1]);
    
    // Extract task ID
    const taskIdMatch = section.match(/Task ID:\s*(.+)/);
    const taskId = taskIdMatch ? taskIdMatch[1].trim() : `P${phaseNum}-W${windowNum}`;
    
    // Extract objective
    const objectiveMatch = section.match(/Objective:\s*(.+)/);
    const objective = objectiveMatch ? objectiveMatch[1].trim() : '';
    
    // Extract command
    const commandMatch = section.match(/Command:\s*```bash\s*([\s\S]*?)```/);
    const command = commandMatch ? commandMatch[1].trim() : '';
    
    // Extract power tier
    const tierMatch = section.match(/Power Tier:\s*(\w+)/);
    const powerTier = tierMatch ? tierMatch[1] : 'BALANCED';
    
    // Extract fallbacks
    const fallbacks = [];
    const fallbackMatches = section.matchAll(/Fallback #\d+:\s*```bash\s*([\s\S]*?)```/g);
    for (const match of fallbackMatches) {
      fallbacks.push(match[1].trim());
    }
    
    // Extract expected output
    const expectedMatch = section.match(/Expected Output:\s*(.+)/);
    const expectedOutput = expectedMatch ? expectedMatch[1].trim() : '';
    
    return {
      phase: phaseNum,
      window: windowNum,
      taskId,
      objective,
      command,
      powerTier,
      fallbacks,
      expectedOutput,
    };
  }

  getNextPendingWindow(stateManager) {
    for (let phase = 0; phase <= 12; phase++) {
      const dispatch = this.loadPhase(phase);
      if (!dispatch) continue;
      
      for (const window of dispatch.windows) {
        const windowId = `P${phase}-W${window.window}`;
        
        // Check if already done
        if (stateManager.state.completedWindows.includes(windowId)) continue;
        if (stateManager.state.failedWindows.includes(windowId)) continue;
        if (stateManager.state.skippedWindows.includes(windowId)) continue;
        
        // Check if currently running
        if (stateManager.state.currentWindow && 
            stateManager.state.currentWindow.phase === phase &&
            stateManager.state.currentWindow.window === window.window) {
          continue;
        }
        
        // Check dependencies (simplified - Phase N depends on Phase N-1)
        if (phase > 0) {
          const prevPhaseComplete = dispatch.windows.every(w => {
            const prevId = `P${phase-1}-W${w.window}`;
            return stateManager.state.completedWindows.includes(prevId);
          });
          if (!prevPhaseComplete) continue;
        }
        
        return window;
      }
    }
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AGENT EXECUTOR
// ─────────────────────────────────────────────────────────────────────────────

class AgentExecutor {
  constructor() {
    this.agentMap = {
      'HIGH': ['claude-opus', 'claude-sonnet', 'codex-o1', 'opencode'],
      'BALANCED': ['claude-sonnet', 'gemini-pro', 'codex-gpt4o', 'opencode'],
      'LOW': ['gemini-flash', 'qwen-max', 'opencode'],
    };
  }

  async execute(window, attempt = 0) {
    const commands = this.buildCommandChain(window);
    
    for (let i = attempt; i < commands.length; i++) {
      console.log(`\n🚀 Executing ${window.taskId} (Attempt ${i + 1}/${commands.length})`);
      console.log(`   Agent: ${this.getAgentName(commands[i])}`);
      console.log(`   Objective: ${window.objective}`);
      
      const result = await this.runCommand(commands[i]);
      
      if (result.success) {
        console.log(`   ✅ Success`);
        return { success: true, cost: result.cost || 0 };
      } else {
        console.log(`   ❌ Failed: ${result.error}`);
        if (i < commands.length - 1) {
          console.log(`   🔄 Trying fallback...`);
        }
      }
    }
    
    return { success: false, error: 'All attempts failed' };
  }

  buildCommandChain(window) {
    const commands = [window.command];
    commands.push(...window.fallbacks);
    return commands;
  }

  async runCommand(command) {
    return new Promise((resolve) => {
      // Note: This is a simulation for now
      // In real implementation, this would spawn the actual agent process
      
      console.log(`   Command: ${command.substring(0, 100)}...`);
      
      // Simulate execution time
      setTimeout(() => {
        // For demo purposes, randomly succeed or fail
        const success = Math.random() > 0.3;
        
        if (success) {
          resolve({ 
            success: true, 
            cost: Math.random() * 5 + 2, // $2-7 per window
            output: 'Completed successfully'
          });
        } else {
          resolve({ 
            success: false, 
            error: 'Execution timeout'
          });
        }
      }, 2000);
    });
  }

  getAgentName(command) {
    if (command.includes('claude --model opus')) return 'Claude Opus';
    if (command.includes('claude --model sonnet')) return 'Claude Sonnet';
    if (command.includes('codex')) return 'Codex';
    if (command.includes('gemini')) return 'Gemini';
    if (command.includes('qwen')) return 'Qwen';
    if (command.includes('opencode')) return 'OpenCode';
    return 'Unknown';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ORCHESTRATOR
// ─────────────────────────────────────────────────────────────────────────────

class Orchestrator {
  constructor() {
    this.state = new StateManager();
    this.parser = new DispatchParser();
    this.executor = new AgentExecutor();
    this.running = false;
  }

  async start() {
    if (this.state.getStatus() === 'running') {
      console.log('⚠️  Orchestrator already running');
      return;
    }
    
    console.log('🚀 Ultra Orchestrator Starting...');
    console.log('═══════════════════════════════════════════════════════════');
    
    this.state.setStatus('running');
    this.running = true;
    
    // Main loop
    while (this.running && this.state.getStatus() === 'running') {
      const window = this.parser.getNextPendingWindow(this.state);
      
      if (!window) {
        console.log('\n✅ All windows complete!');
        this.state.setStatus('completed');
        break;
      }
      
      // Check if we should pause (e.g., end of phase)
      if (this.shouldPauseAtGate(window)) {
        console.log(`\n🚪 Gate detected after Phase ${window.phase - 1}`);
        this.state.setStatus('paused');
        this.showGateMenu(window.phase - 1);
        break;
      }
      
      // Execute window
      await this.executeWindow(window);
      
      // Small delay between windows
      await this.sleep(1000);
    }
  }

  async executeWindow(window) {
    // Mark as running
    const agentName = this.executor.getAgentName(window.command);
    this.state.markWindowRunning(window.phase, window.window, agentName);
    
    // Execute
    const result = await this.executor.execute(window);
    
    if (result.success) {
      this.state.markWindowComplete(window.phase, window.window, result.cost);
      console.log(`   💰 Cost: $${result.cost.toFixed(2)}`);
    } else {
      this.state.markWindowFailed(window.phase, window.window);
      console.log(`   ⚠️  Window failed after all fallbacks`);
    }
  }

  shouldPauseAtGate(window) {
    // Pause at the end of each phase (before starting next)
    if (window.window === 1 && window.phase > 0) {
      // Check if previous phase just completed
      const prevPhase = window.phase - 1;
      const prevDispatch = this.parser.loadPhase(prevPhase);
      
      if (prevDispatch) {
        const allComplete = prevDispatch.windows.every(w => {
          const id = `P${prevPhase}-W${w.window}`;
          return this.state.state.completedWindows.includes(id);
        });
        
        return allComplete;
      }
    }
    return false;
  }

  showGateMenu(phase) {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log(`🚪 GATE ${phase}: Phase ${phase} Complete`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\nValidation Criteria:');
    console.log('  (Check v20-phase{phase}-dispatches.md for criteria)');
    console.log('\nOptions:');
    console.log('  [1] Approve → Continue to next phase');
    console.log('  [2] Review → Show Phase details');
    console.log('  [3] Stop → Exit orchestrator');
    console.log('\nRun: npm run ultra:resume to continue');
  }

  pause() {
    this.state.setStatus('paused');
    this.running = false;
    console.log('⏸️  Orchestrator paused (will stop after current window)');
  }

  resume() {
    if (this.state.getStatus() === 'paused') {
      console.log('▶️  Resuming...');
      this.start();
    } else {
      console.log('⚠️  Not in paused state');
    }
  }

  stop() {
    this.state.setStatus('stopped');
    this.running = false;
    console.log('🛑 Orchestrator stopped');
  }

  status() {
    const progress = this.state.getProgress();
    const current = progress.current;
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('Ultra-Dex v2.0 Hard Reset — Status');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\nStatus: ${this.state.getStatus().toUpperCase()}`);
    
    if (current) {
      console.log(`Phase: ${current.phase} (Window ${current.window})`);
      console.log(`Agent: ${current.agent}`);
    }
    
    console.log(`\nProgress: ${progress.completed}/${progress.total} windows (${progress.percent}%)`);
    console.log(`Failed: ${progress.failed}`);
    
    // Progress bar
    const barWidth = 30;
    const filled = Math.round((progress.percent / 100) * barWidth);
    const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);
    console.log(`[${bar}]`);
    
    // Phase breakdown
    console.log('\nPhase Breakdown:');
    for (let p = 0; p <= 4; p++) {
      const phaseWindows = this.parser.loadPhase(p)?.windows || [];
      const completed = phaseWindows.filter(w => {
        const id = `P${p}-W${w.window}`;
        return this.state.state.completedWindows.includes(id);
      }).length;
      const total = phaseWindows.length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      console.log(`  Phase ${p}: ${completed}/${total} (${pct}%)`);
    }
    
    console.log('\nRun "npm run ultra:dashboard" for live view');
  }

  report() {
    const progress = this.state.getProgress();
    const date = new Date().toISOString().split('T')[0];
    
    const report = `# Daily Report — ${date}

## Summary
- Windows Completed: ${progress.completed}/${progress.total}
- Failed: ${progress.failed}
- Progress: ${progress.percent}%
- Status: ${this.state.getStatus()}

## Today's Activity
${this.generateActivityLog()}

## Cost Summary
${this.generateCostSummary()}

## Tomorrow's Plan
${this.generateTomorrowPlan()}
`;

    const reportPath = path.join(CONFIG.reportDir, `${date}.md`);
    if (!fs.existsSync(CONFIG.reportDir)) {
      fs.mkdirSync(CONFIG.reportDir, { recursive: true });
    }
    fs.writeFileSync(reportPath, report);
    
    console.log(`\n📊 Report generated: ${reportPath}`);
    console.log(report);
  }

  generateActivityLog() {
    // In real implementation, this would show today's completed windows
    return '- No activity recorded today\n';
  }

  generateCostSummary() {
    const costs = Object.values(this.state.state.costs);
    const total = costs.reduce((a, b) => a + b, 0);
    return `- Total Cost: $${total.toFixed(2)}\n- Windows Costed: ${costs.length}\n`;
  }

  generateTomorrowPlan() {
    const next = this.parser.getNextPendingWindow(this.state);
    if (next) {
      return `- Next: ${next.taskId}\n- Objective: ${next.objective}\n`;
    }
    return '- All windows complete!\n';
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI INTERFACE
// ─────────────────────────────────────────────────────────────────────────────

function printHelp() {
  console.log(`
Ultra Orchestrator — V2.0 Hard Reset Automation

Usage:
  npm run ultra:start    Start automated execution
  npm run ultra:status   Show current status
  npm run ultra:pause    Pause after current window
  npm run ultra:resume   Resume from pause
  npm run ultra:stop     Stop execution
  npm run ultra:report   Generate daily report

Manual Mode:
  See WORKFLOW-MANUAL.md for manual execution guide

Configuration:
  Edit .ultra-dex/orchestrator-config.json
`);
}

async function main() {
  const command = process.argv[2];
  const orchestrator = new Orchestrator();
  
  switch (command) {
    case 'start':
      await orchestrator.start();
      break;
    case 'status':
      orchestrator.status();
      break;
    case 'pause':
      orchestrator.pause();
      break;
    case 'resume':
      orchestrator.resume();
      break;
    case 'stop':
      orchestrator.stop();
      break;
    case 'report':
      orchestrator.report();
      break;
    default:
      printHelp();
  }
}

main().catch(console.error);
