// Copyright (c) 2026 Ultra-Dex

import { execSync } from 'child_process';
import path from 'path';

export const gitIntegration = {
  options: {
    repoPath: process.cwd(),
  },

  _exec(command) {
    try {
      return execSync(`git ${command}`, {
        cwd: this.options.repoPath,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
    } catch (error) {
      return null;
    }
  },
  
  async isGitRepository() {
    return this._exec('rev-parse --is-inside-work-tree') === 'true';
  },

  async getCurrentBranch() {
    return this._exec('branch --show-current') || 'unknown';
  },

  async getStatus() {
    const output = this._exec('status --porcelain');
    if (output === null) return { files: [] };
    
    const files = output.split('\n').filter(Boolean).map(line => {
      const status = line.slice(0, 2);
      const path = line.slice(3);
      return { path, status };
    });
    
    return { files };
  },

  async getWorkingDiff() {
    return this._exec('diff') || '';
  },

  async getStagedDiff() {
    return this._exec('diff --cached') || '';
  },

  async getLog(count = 10) {
    const output = this._exec(`log -n ${count} --pretty=format:"%h|%an|%at|%s"`);
    if (!output) return [];
    
    return output.split('\n').map(line => {
      const [hash, author, timestamp, subject] = line.split('|');
      return { hash, author, timestamp: parseInt(timestamp, 10), subject };
    });
  },

  async getCurrentCommitHash() {
    return this._exec('rev-parse HEAD') || 'unknown';
  },

  async getChangedFiles() {
    const output = this._exec('diff --name-only HEAD');
    return output ? output.split('\n') : [];
  },

  async getFileHistory(file) {
    const output = this._exec(`log --pretty=format:"%h|%an|%at|%s" -- "${file}"`);
    if (!output) return [];
    
    return output.split('\n').map(line => {
      const [hash, author, timestamp, subject] = line.split('|');
      return { hash, author, timestamp: parseInt(timestamp, 10), subject };
    });
  },

  async getConfig(key) {
    return this._exec(`config --get ${key}`) || '';
  },

  async getRepoRoot() {
    return this._exec('rev-parse --show-toplevel') || this.options.repoPath;
  },

  async getGitContext() {
    const isRepo = await this.isGitRepository();
    if (!isRepo) return { isGitRepo: false };
    
    return {
      isGitRepo: true,
      branch: await this.getCurrentBranch(),
      commit: await this.getCurrentCommitHash(),
      root: await this.getRepoRoot()
    };
  },

  async linkMemoryToGit(memory) {
    const context = await this.getGitContext();
    return { 
      ...memory, 
      _gitLinked: context.isGitRepo, 
      gitContext: context 
    };
  }
};
