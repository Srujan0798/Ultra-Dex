/**
 * Git Integration Module for Ultra-Dex
 * Provides Git-aware features for the AI orchestration platform
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

class GitIntegration {
  constructor(options = {}) {
    this.options = {
      repoPath: options.repoPath || process.cwd(),
      ...options
    };
  }

  /**
   * Check if the current directory is a Git repository
   * @returns {Promise<boolean>} True if Git repository exists
   */
  async isGitRepository() {
    try {
      await fs.access(path.join(this.options.repoPath, '.git'));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current Git branch
   * @returns {Promise<string>} Current branch name
   */
  async getCurrentBranch() {
    if (!(await this.isGitRepository())) {
      throw new Error('Not a Git repository');
    }

    const { stdout } = await execAsync('git branch --show-current', { cwd: this.options.repoPath });
    return stdout.trim();
  }

  /**
   * Get Git status
   * @returns {Promise<object>} Git status information
   */
  async getStatus() {
    if (!(await this.isGitRepository())) {
      throw new Error('Not a Git repository');
    }

    const { stdout } = await execAsync('git status --porcelain', { cwd: this.options.repoPath });
    const lines = stdout.trim().split('\n').filter(line => line);

    const status = {
      files: [],
      created: [],
      modified: [],
      deleted: [],
      renamed: [],
      staged: [],
      conflicted: []
    };

    for (const line of lines) {
      if (!line) continue;
      const [index, worktree, ...filePathParts] = line.split(' ');
      const filePath = filePathParts.join(' ').trim();

      status.files.push({ index, worktree, path: filePath });

      if (index === 'A' || worktree === 'A') status.created.push(filePath);
      if (index === 'M' || worktree === 'M') status.modified.push(filePath);
      if (index === 'D' || worktree === 'D') status.deleted.push(filePath);
      if (index === 'R') status.renamed.push({ from: filePath, to: filePath }); // Simplified
      if (index !== ' ' && index !== '?') status.staged.push(filePath);
      if (index === 'U' || worktree === 'U') status.conflicted.push(filePath);
    }

    return status;
  }

  /**
   * Get Git diff for staged files
   * @returns {Promise<string>} Diff output
   */
  async getStagedDiff() {
    if (!(await this.isGitRepository())) {
      throw new Error('Not a Git repository');
    }

    try {
      const { stdout } = await execAsync('git diff --cached', { cwd: this.options.repoPath });
      return stdout || ''; // Return empty string if no staged changes
    } catch (error) {
      // If git diff --cached fails (e.g., no staged changes), return empty string
      return '';
    }
  }

  /**
   * Get Git diff for working directory
   * @returns {Promise<string>} Diff output
   */
  async getWorkingDiff() {
    if (!(await this.isGitRepository())) {
      throw new Error('Not a Git repository');
    }

    try {
      const { stdout } = await execAsync('git diff', { cwd: this.options.repoPath });
      return stdout || ''; // Return empty string if no diff
    } catch (error) {
      // If git diff fails (e.g., no changes), return empty string
      // Different git versions may return different exit codes
      if (error.code === '1' || error.code === 1 || error.stderr?.includes('nothing to commit')) {
        return '';
      }
      // For other errors, log and return empty string rather than throwing
      console.warn('Git diff failed:', error.message);
      return '';
    }
  }

  /**
   * Get Git log (last N commits)
   * @param {number} count - Number of commits to retrieve
   * @returns {Promise<Array>} Array of commit objects
   */
  async getLog(count = 10) {
    if (!(await this.isGitRepository())) {
      throw new Error('Not a Git repository');
    }

    const { stdout } = await execAsync(`git log --oneline --pretty=format:"%H|%an|%ae|%ad|%s" -n ${count}`, { cwd: this.options.repoPath });
    const lines = stdout.trim().split('\n').filter(line => line);

    return lines.map(line => {
      const [hash, authorName, authorEmail, date, subject] = line.split('|');
      return {
        hash,
        author: { name: authorName, email: authorEmail },
        date,
        message: subject,
        refs: [] // Simplified - refs not parsed
      };
    });
  }

  /**
   * Get current commit hash
   * @returns {Promise<string>} Commit hash
   */
  async getCurrentCommitHash() {
    if (!(await this.isGitRepository())) {
      throw new Error('Not a Git repository');
    }

    const { stdout } = await execAsync('git rev-parse HEAD', { cwd: this.options.repoPath });
    return stdout.trim();
  }

  /**
   * Get Git remote URL
   * @returns {Promise<string>} Remote URL
   */
  async getRemoteUrl() {
    if (!(await this.isGitRepository())) {
      throw new Error('Not a Git repository');
    }

    try {
      const { stdout } = await execAsync('git remote get-url origin', { cwd: this.options.repoPath });
      return stdout.trim();
    } catch {
      return null;
    }
  }

  /**
   * Get list of changed files in current diff
   * @returns {Promise<Array>} Array of changed file paths
   */
  async getChangedFiles() {
    if (!(await this.isGitRepository())) {
      throw new Error('Not a Git repository');
    }

    const status = await this.getStatus();
    return [
      ...status.created,
      ...status.modified,
      ...status.deleted,
      ...status.renamed.map(r => typeof r === 'object' ? r.to : r)
    ];
  }

  /**
   * Get file content at specific commit
   * @param {string} filePath - Path to the file
   * @param {string} commitHash - Commit hash (defaults to HEAD)
   * @returns {Promise<string>} File content
   */
  async getFileAtCommit(filePath, commitHash = 'HEAD') {
    if (!(await this.isGitRepository())) {
      throw new Error('Not a Git repository');
    }

    const { stdout } = await execAsync(`git show ${commitHash}:${filePath}`, { cwd: this.options.repoPath });
    return stdout;
  }

  /**
   * Get commit history for a specific file
   * @param {string} filePath - Path to the file
   * @returns {Promise<Array>} Array of commits affecting the file
   */
  async getFileHistory(filePath) {
    if (!(await this.isGitRepository())) {
      throw new Error('Not a Git repository');
    }

    const { stdout } = await execAsync(`git log --oneline --pretty=format:"%H|%an|%ae|%ad|%s" ${filePath}`, { cwd: this.options.repoPath });
    const lines = stdout.trim().split('\n').filter(line => line);

    return lines.map(line => {
      const [hash, authorName, authorEmail, date, subject] = line.split('|');
      return {
        hash,
        author: { name: authorName, email: authorEmail },
        date,
        message: subject,
        refs: [] // Simplified - refs not parsed
      };
    });
  }

  /**
   * Check if there are uncommitted changes
   * @returns {Promise<boolean>} True if there are uncommitted changes
   */
  async hasUncommittedChanges() {
    if (!(await this.isGitRepository())) {
      throw new Error('Not a Git repository');
    }

    const { stdout } = await execAsync('git status --porcelain', { cwd: this.options.repoPath });
    return stdout.trim().length > 0;
  }

  /**
   * Get Git configuration value
   * @param {string} key - Configuration key (e.g., 'user.name', 'user.email')
   * @returns {Promise<string>} Configuration value
   */
  async getConfig(key) {
    if (!(await this.isGitRepository())) {
      throw new Error('Not a Git repository');
    }

    try {
      const { stdout } = await execAsync(`git config ${key}`, { cwd: this.options.repoPath });
      return stdout.trim();
    } catch {
      return null;
    }
  }

  /**
   * Get the Git repository root path
   * @returns {Promise<string>} Repository root path
   */
  async getRepoRoot() {
    if (!(await this.isGitRepository())) {
      throw new Error('Not a Git repository');
    }

    const { stdout } = await execAsync('git rev-parse --show-toplevel', { cwd: this.options.repoPath });
    return stdout.trim();
  }

  /**
   * Get branch-specific configuration for Ultra-Dex
   * @param {string} branchName - Branch name
   * @returns {Promise<object>} Branch configuration
   */
  async getBranchConfig(branchName) {
    try {
      const configPath = path.join(this.options.repoPath, '.ultra-dex', `${branchName}.json`);
      const configContent = await fs.readFile(configPath, 'utf8');
      return JSON.parse(configContent);
    } catch {
      // If branch-specific config doesn't exist, return default
      return {
        agents: ['planner', 'reviewer', 'backend'],
        providers: ['openai', 'anthropic'],
        sandbox: true,
        autoCommit: false
      };
    }
  }

  /**
   * Track changes in memory by linking Git commits to memory entries
   * @param {object} memoryEntry - Memory entry to link to Git
   * @returns {Promise<object>} Updated memory entry with Git context
   */
  async linkMemoryToGit(memoryEntry) {
    if (!(await this.isGitRepository())) {
      return memoryEntry;
    }

    const currentCommit = await this.getCurrentCommitHash();
    const currentBranch = await this.getCurrentBranch();
    const changedFiles = await this.getChangedFiles();

    return {
      ...memoryEntry,
      gitContext: {
        commit: currentCommit,
        branch: currentBranch,
        changedFiles,
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Create a Git-aware memory tag
   * @param {string} tag - Tag name
   * @param {string} description - Tag description
   * @returns {Promise<void>}
   */
  async createMemoryTag(tag, description) {
    if (!(await this.isGitRepository())) {
      throw new Error('Not a Git repository');
    }

    // Create a Git tag with the memory tag as annotation
    await execAsync(`git tag -a ${tag} -m "${description}"`, { cwd: this.options.repoPath });
  }

  /**
   * Get Git-aware context for AI agents
   * @returns {Promise<object>} Git context for AI agents
   */
  async getGitContext() {
    if (!(await this.isGitRepository())) {
      return {
        isGitRepo: false,
        error: 'Not a Git repository'
      };
    }

    try {
      const [
        currentBranch,
        currentCommit,
        status,
        changedFiles,
        remoteUrl,
        userName,
        userEmail
      ] = await Promise.all([
        this.getCurrentBranch(),
        this.getCurrentCommitHash(),
        this.getStatus(),
        this.getChangedFiles(),
        this.getRemoteUrl(),
        this.getConfig('user.name'),
        this.getConfig('user.email')
      ]);

      return {
        isGitRepo: true,
        currentBranch,
        currentCommit,
        status: {
          staged: status.staged,
          modified: status.modified,
          created: status.created,
          deleted: status.deleted,
          conflicted: status.conflicted
        },
        changedFiles,
        remoteUrl,
        user: {
          name: userName,
          email: userEmail
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        isGitRepo: true,
        error: error.message
      };
    }
  }

  /**
   * Stage files for commit
   * @param {Array<string>} files - Files to stage
   * @returns {Promise<void>}
   */
  async stageFiles(files) {
    if (!(await this.isGitRepository())) {
      throw new Error('Not a Git repository');
    }

    const filesList = files.join(' ');
    await execAsync(`git add ${filesList}`, { cwd: this.options.repoPath });
  }

  /**
   * Commit changes
   * @param {string} message - Commit message
   * @returns {Promise<object>} Commit result
   */
  async commitChanges(message) {
    if (!(await this.isGitRepository())) {
      throw new Error('Not a Git repository');
    }

    const { stdout } = await execAsync(`git commit -m "${message}"`, { cwd: this.options.repoPath });
    return { success: true, message: stdout };
  }

  /**
   * Push changes to remote
   * @param {string} remote - Remote name (default: 'origin')
   * @param {string} branch - Branch name (default: current branch)
   * @returns {Promise<void>}
   */
  async pushChanges(remote = 'origin', branch = null) {
    if (!(await this.isGitRepository())) {
      throw new Error('Not a Git repository');
    }

    const branchName = branch || await this.getCurrentBranch();
    await execAsync(`git push ${remote} ${branchName}`, { cwd: this.options.repoPath });
  }
}

// Export singleton instance
export const gitIntegration = new GitIntegration();

// Export class for instantiation with custom options
export default GitIntegration;