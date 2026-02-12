// Copyright (c) 2026 Ultra-Dex

/**
 * cli/lib/integrations/github.js
 * GitHub Integration with Real API Implementation
 */

import sodium from 'libsodium-wrappers';
import { Octokit } from 'octokit';
import { printInfo, printSuccess, printWarning, printError } from '../utils/output.js';
import { requireConfig } from './utils.js';
import { throttling } from '@octokit/plugin-throttling';
import { retry } from '@octokit/plugin-retry';

// Create Octokit with plugins
const MyOctokit = Octokit.plugin(throttling, retry);

export class GitHubClient {
  constructor(token, options = {}) {
    requireConfig({ token }, ['token'], 'GitHub');
    this.token = token;
    this.owner = options.owner;
    this.repo = options.repo;

    // Initialize Octokit with proper configuration
    this.octokit = new MyOctokit({
      auth: this.token,
      throttle: {
        onRateLimit: (retryAfter, options) => {
          printWarning(`Rate limit exceeded. Retrying after ${retryAfter} seconds.`);
          return true; // Retry the request
        },
        onSecondaryRateLimit: (retryAfter, options) => {
          printWarning(`Secondary rate limit exceeded. Retrying after ${retryAfter} seconds.`);
          return true; // Retry the request
        },
      },
      retry: {
        doNotRetry: ['429'], // Don't retry on rate limit errors
      },
    });
  }

  /**
   * Create a new issue
   */
  async createIssue(owner, repo, title, body, options = {}) {
    try {
      const response = await this.octokit.rest.issues.create({
        owner,
        repo,
        title,
        body,
        labels: options.labels || [],
        assignees: options.assignees || [],
        milestone: options.milestone,
      });

      printSuccess(`✅ Created GitHub issue: #${response.data.number} - ${response.data.title}`);
      return response.data;
    } catch (error) {
      printError(`Failed to create GitHub issue: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get an issue by number
   */
  async getIssue(owner, repo, issueNumber) {
    try {
      const response = await this.octokit.rest.issues.get({
        owner,
        repo,
        issue_number: issueNumber,
      });

      return response.data;
    } catch (error) {
      printError(`Failed to get GitHub issue #${issueNumber}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update an issue
   */
  async updateIssue(owner, repo, issueNumber, updates) {
    try {
      const response = await this.octokit.rest.issues.update({
        owner,
        repo,
        issue_number: issueNumber,
        ...updates,
      });

      printSuccess(`✅ Updated GitHub issue: #${response.data.number}`);
      return response.data;
    } catch (error) {
      printError(`Failed to update GitHub issue #${issueNumber}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a pull request
   */
  async createPullRequest(owner, repo, title, head, base, body, options = {}) {
    try {
      const response = await this.octokit.rest.pulls.create({
        owner,
        repo,
        title,
        head,
        base,
        body,
        draft: options.draft || false,
        maintainer_can_modify: options.maintainerCanModify !== false,
      });

      printSuccess(`✅ Created GitHub PR: #${response.data.number} - ${response.data.title}`);
      return response.data;
    } catch (error) {
      printError(`Failed to create GitHub PR: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get a pull request by number
   */
  async getPullRequest(owner, repo, prNumber) {
    try {
      const response = await this.octokit.rest.pulls.get({
        owner,
        repo,
        pull_number: prNumber,
      });

      return response.data;
    } catch (error) {
      printError(`Failed to get GitHub PR #${prNumber}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update a pull request
   */
  async updatePullRequest(owner, repo, prNumber, updates) {
    try {
      const response = await this.octokit.rest.pulls.update({
        owner,
        repo,
        pull_number: prNumber,
        ...updates,
      });

      printSuccess(`✅ Updated GitHub PR: #${response.data.number}`);
      return response.data;
    } catch (error) {
      printError(`Failed to update GitHub PR #${prNumber}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Merge a pull request
   */
  async mergePullRequest(owner, repo, prNumber, options = {}) {
    try {
      const response = await this.octokit.rest.pulls.merge({
        owner,
        repo,
        pull_number: prNumber,
        commit_title: options.commitTitle,
        commit_message: options.commitMessage,
        merge_method: options.mergeMethod || 'merge', // 'merge', 'squash', or 'rebase'
      });

      if (response.data.merged) {
        printSuccess(`✅ Merged GitHub PR: #${prNumber}`);
        return response.data;
      } else {
        throw new Error(`Failed to merge PR: ${response.data.message}`);
      }
    } catch (error) {
      printError(`Failed to merge GitHub PR #${prNumber}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a branch
   */
  async createBranch(owner, repo, branchName, baseRef) {
    try {
      // Get the SHA of the base reference
      const { data: refData } = await this.octokit.rest.git.getRef({
        owner,
        repo,
        ref: `heads/${baseRef}`,
      });

      // Create the new branch
      const response = await this.octokit.rest.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha: refData.object.sha,
      });

      printSuccess(`✅ Created GitHub branch: ${branchName}`);
      return response.data;
    } catch (error) {
      printError(`Failed to create GitHub branch ${branchName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a commit
   */
  async createCommit(owner, repo, message, tree, parents, options = {}) {
    try {
      const response = await this.octokit.rest.git.createCommit({
        owner,
        repo,
        message,
        tree,
        parents,
        author: options.author,
        committer: options.committer,
      });

      printSuccess(`✅ Created GitHub commit: ${response.data.sha.substring(0, 7)}`);
      return response.data;
    } catch (error) {
      printError(`Failed to create GitHub commit: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create or update a file
   */
  async createOrUpdateFile(owner, repo, path, content, commitMessage, options = {}) {
    try {
      // Try to get the file first to see if it exists
      let existingFile;
      try {
        existingFile = await this.octokit.rest.repos.getContent({
          owner,
          repo,
          path,
        });
      } catch (error) {
        // File doesn't exist, that's fine
        existingFile = null;
      }

      const params = {
        owner,
        repo,
        path,
        message: commitMessage,
        content: Buffer.from(content).toString('base64'),
      };

      if (existingFile && existingFile.data.sha) {
        params.sha = existingFile.data.sha;
      }

      if (options.branch) {
        params.branch = options.branch;
      }

      const response = await this.octokit.rest.repos.createOrUpdateFileContents(params);

      const action = existingFile ? 'Updated' : 'Created';
      printSuccess(`✅ ${action} GitHub file: ${path}`);
      return response.data;
    } catch (error) {
      printError(`Failed to create/update GitHub file ${path}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get repository information
   */
  async getRepository(owner, repo) {
    try {
      const response = await this.octokit.rest.repos.get({
        owner,
        repo,
      });

      return response.data;
    } catch (error) {
      printError(`Failed to get GitHub repository ${owner}/${repo}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get repository contents
   */
  async getRepositoryContents(owner, repo, path = '/', options = {}) {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref: options.ref,
      });

      return response.data;
    } catch (error) {
      printError(`Failed to get GitHub repository contents for ${path}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get repository commits
   */
  async getRepositoryCommits(owner, repo, options = {}) {
    try {
      const response = await this.octokit.rest.repos.listCommits({
        owner,
        repo,
        sha: options.sha,
        path: options.path,
        author: options.author,
        since: options.since,
        until: options.until,
        per_page: options.perPage || 30,
        page: options.page || 1,
      });

      return response.data;
    } catch (error) {
      printError(`Failed to get GitHub repository commits: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get pull requests
   */
  async getPullRequests(owner, repo, options = {}) {
    try {
      const response = await this.octokit.rest.pulls.list({
        owner,
        repo,
        state: options.state || 'open',
        head: options.head,
        base: options.base,
        sort: options.sort || 'created',
        direction: options.direction || 'desc',
        per_page: options.perPage || 30,
        page: options.page || 1,
      });

      return response.data;
    } catch (error) {
      printError(`Failed to get GitHub pull requests: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get issues
   */
  async getIssues(owner, repo, options = {}) {
    try {
      const response = await this.octokit.rest.issues.listForRepo({
        owner,
        repo,
        state: options.state || 'open',
        labels: options.labels,
        sort: options.sort || 'created',
        direction: options.direction || 'desc',
        per_page: options.perPage || 30,
        page: options.page || 1,
      });

      return response.data;
    } catch (error) {
      printError(`Failed to get GitHub issues: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add labels to an issue
   */
  async addLabelsToIssue(owner, repo, issueNumber, labels) {
    try {
      const response = await this.octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number: issueNumber,
        labels,
      });

      printSuccess(`✅ Added labels to GitHub issue #${issueNumber}: ${labels.join(', ')}`);
      return response.data;
    } catch (error) {
      printError(`Failed to add labels to GitHub issue #${issueNumber}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove label from an issue
   */
  async removeLabelFromIssue(owner, repo, issueNumber, label) {
    try {
      await this.octokit.rest.issues.removeLabel({
        owner,
        repo,
        issue_number: issueNumber,
        name: label,
      });

      printSuccess(`✅ Removed label from GitHub issue #${issueNumber}: ${label}`);
      return true;
    } catch (error) {
      printError(`Failed to remove label from GitHub issue #${issueNumber}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a release
   */
  async createRelease(owner, repo, tagName, options = {}) {
    try {
      const response = await this.octokit.rest.repos.createRelease({
        owner,
        repo,
        tag_name: tagName,
        name: options.name || tagName,
        body: options.body || '',
        draft: options.draft || false,
        prerelease: options.prerelease || false,
        target_commitish: options.targetCommitish,
      });

      printSuccess(`✅ Created GitHub release: ${response.data.tag_name}`);
      return response.data;
    } catch (error) {
      printError(`Failed to create GitHub release: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get releases
   */
  async getReleases(owner, repo, options = {}) {
    try {
      const response = await this.octokit.rest.repos.listReleases({
        owner,
        repo,
        per_page: options.perPage || 30,
        page: options.page || 1,
      });

      return response.data;
    } catch (error) {
      printError(`Failed to get GitHub releases: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a deployment
   */
  async createDeployment(owner, repo, ref, options = {}) {
    try {
      const response = await this.octokit.rest.repos.createDeployment({
        owner,
        repo,
        ref,
        task: options.task || 'deploy',
        auto_merge: options.autoMerge !== false,
        required_contexts: options.requiredContexts || [],
        payload: options.payload || {},
        environment: options.environment || 'production',
        description: options.description || '',
        transient_environment: options.transientEnvironment || false,
        production_environment: options.productionEnvironment !== false,
      });

      printSuccess(`✅ Created GitHub deployment for ref: ${ref}`);
      return response.data;
    } catch (error) {
      printError(`Failed to create GitHub deployment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a deployment status
   */
  async createDeploymentStatus(owner, repo, deploymentId, state, options = {}) {
    try {
      const response = await this.octokit.rest.repos.createDeploymentStatus({
        owner,
        repo,
        deployment_id: deploymentId,
        state,
        log_url: options.logUrl,
        description: options.description,
        environment_url: options.environmentUrl,
        auto_inactive: options.autoInactive !== false,
      });

      printSuccess(`✅ Created GitHub deployment status: ${state}`);
      return response.data;
    } catch (error) {
      printError(`Failed to create GitHub deployment status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get deployment statuses
   */
  async getDeploymentStatuses(owner, repo, deploymentId, options = {}) {
    try {
      const response = await this.octokit.rest.repos.listDeploymentStatuses({
        owner,
        repo,
        deployment_id: deploymentId,
        per_page: options.perPage || 30,
        page: options.page || 1,
      });

      return response.data;
    } catch (error) {
      printError(`Failed to get GitHub deployment statuses: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get repository collaborators
   */
  async getCollaborators(owner, repo, options = {}) {
    try {
      const response = await this.octokit.rest.repos.listCollaborators({
        owner,
        repo,
        affiliation: options.affiliation || 'all',
        per_page: options.perPage || 30,
        page: options.page || 1,
      });

      return response.data;
    } catch (error) {
      printError(`Failed to get GitHub repository collaborators: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check repository permissions for a user
   */
  async checkCollaboratorPermission(owner, repo, username) {
    try {
      const response = await this.octokit.rest.repos.getCollaboratorPermissionLevel({
        owner,
        repo,
        username,
      });

      return response.data;
    } catch (error) {
      printError(`Failed to check collaborator permission: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a project card
   */
  async createProjectCard(owner, repo, projectId, contentId, contentType = 'Issue') {
    try {
      const response = await this.octokit.rest.projects.createCard({
        column_id: projectId, // Actually the column ID
        content_id: contentId,
        content_type: contentType,
      });

      printSuccess(`✅ Created GitHub project card: ${response.data.id}`);
      return response.data;
    } catch (error) {
      printError(`Failed to create GitHub project card: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get repository languages
   */
  async getLanguages(owner, repo) {
    try {
      const response = await this.octokit.rest.repos.listLanguages({
        owner,
        repo,
      });

      return response.data;
    } catch (error) {
      printError(`Failed to get GitHub repository languages: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get repository contributors
   */
  async getContributors(owner, repo, options = {}) {
    try {
      const response = await this.octokit.rest.repos.listContributors({
        owner,
        repo,
        anon: options.anon || false,
        per_page: options.perPage || 30,
        page: options.page || 1,
      });

      return response.data;
    } catch (error) {
      printError(`Failed to get GitHub repository contributors: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get repository stargazers
   */
  async getStargazers(owner, repo, options = {}) {
    try {
      const response = await this.octokit.rest.activity.listStargazersForRepo({
        owner,
        repo,
        per_page: options.perPage || 30,
        page: options.page || 1,
      });

      return response.data;
    } catch (error) {
      printError(`Failed to get GitHub repository stargazers: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get repository forks
   */
  async getForks(owner, repo, options = {}) {
    try {
      const response = await this.octokit.rest.repos.listForks({
        owner,
        repo,
        sort: options.sort || 'newest',
        per_page: options.perPage || 30,
        page: options.page || 1,
      });

      return response.data;
    } catch (error) {
      printError(`Failed to get GitHub repository forks: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get repository tags
   */
  async getTags(owner, repo, options = {}) {
    try {
      const response = await this.octokit.rest.repos.listTags({
        owner,
        repo,
        per_page: options.perPage || 30,
        page: options.page || 1,
      });

      return response.data;
    } catch (error) {
      printError(`Failed to get GitHub repository tags: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get repository branches
   */
  async getBranches(owner, repo, options = {}) {
    try {
      const response = await this.octokit.rest.repos.listBranches({
        owner,
        repo,
        protected: options.protected,
        per_page: options.perPage || 30,
        page: options.page || 1,
      });

      return response.data;
    } catch (error) {
      printError(`Failed to get GitHub repository branches: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get branch protection rules
   */
  async getBranchProtection(owner, repo, branch) {
    try {
      const response = await this.octokit.rest.repos.getBranchProtection({
        owner,
        repo,
        branch,
      });

      return response.data;
    } catch (error) {
      // Branch protection might not be set up, which is fine
      if (error.status === 404) {
        return null;
      }
      printError(`Failed to get GitHub branch protection: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update branch protection rules
   */
  async updateBranchProtection(owner, repo, branch, protectionSettings) {
    try {
      const response = await this.octokit.rest.repos.updateBranchProtection({
        owner,
        repo,
        branch,
        required_status_checks: protectionSettings.requiredStatusChecks || null,
        enforce_admins: protectionSettings.enforceAdmins || false,
        required_pull_request_reviews: protectionSettings.requiredPullRequestReviews || null,
        restrictions: protectionSettings.restrictions || null,
        required_linear_history: protectionSettings.requiredLinearHistory || false,
        allow_force_pushes: protectionSettings.allowForcePushes || null,
        allow_deletions: protectionSettings.allowDeletions || false,
        block_creations: protectionSettings.blockCreations || false,
        required_conversation_resolution:
          protectionSettings.requiredConversationResolution || false,
      });

      printSuccess(`✅ Updated GitHub branch protection for: ${branch}`);
      return response.data;
    } catch (error) {
      printError(`Failed to update GitHub branch protection: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get repository workflows
   */
  async getWorkflows(owner, repo, options = {}) {
    try {
      const response = await this.octokit.rest.actions.listRepoWorkflows({
        owner,
        repo,
        per_page: options.perPage || 30,
        page: options.page || 1,
      });

      return response.data;
    } catch (error) {
      printError(`Failed to get GitHub workflows: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get workflow runs
   */
  async getWorkflowRuns(owner, repo, options = {}) {
    try {
      const response = await this.octokit.rest.actions.listWorkflowRuns({
        owner,
        repo,
        workflow_id: options.workflowId,
        actor: options.actor,
        branch: options.branch,
        event: options.event,
        status: options.status,
        per_page: options.perPage || 30,
        page: options.page || 1,
      });

      return response.data;
    } catch (error) {
      printError(`Failed to get GitHub workflow runs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Trigger a workflow dispatch
   */
  async triggerWorkflowDispatch(owner, repo, workflowId, ref, inputs = {}) {
    try {
      const response = await this.octokit.rest.actions.createWorkflowDispatch({
        owner,
        repo,
        workflow_id: workflowId,
        ref,
        inputs,
      });

      printSuccess(`✅ Triggered GitHub workflow dispatch: ${workflowId}`);
      return response.data;
    } catch (error) {
      printError(`Failed to trigger GitHub workflow dispatch: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get repository secrets
   */
  async getSecrets(owner, repo) {
    try {
      const response = await this.octokit.rest.actions.listRepoSecrets({
        owner,
        repo,
      });

      return response.data;
    } catch (error) {
      printError(`Failed to get GitHub repository secrets: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create or update repository secret
   */
  async createOrUpdateSecret(owner, repo, secretName, secretValue) {
    try {
      // Get public key for encryption
      const { data: keyData } = await this.octokit.rest.actions.getRepoPublicKey({
        owner,
        repo,
      });

      // Encrypt the secret value
      const encryptedValue = await encryptSecret(secretValue, keyData.key);

      const response = await this.octokit.rest.actions.createOrUpdateRepoSecret({
        owner,
        repo,
        secret_name: secretName,
        encrypted_value: encryptedValue,
        key_id: keyData.key_id,
      });

      const action = response.status === 201 ? 'Created' : 'Updated';
      printSuccess(`✅ ${action} GitHub repository secret: ${secretName}`);
      return response.data;
    } catch (error) {
      printError(`Failed to create/update GitHub repository secret: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get repository variables
   */
  async getVariables(owner, repo) {
    try {
      const response = await this.octokit.rest.actions.listRepoVariables({
        owner,
        repo,
      });

      return response.data;
    } catch (error) {
      printError(`Failed to get GitHub repository variables: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create or update repository variable
   */
  async createOrUpdateVariable(owner, repo, variableName, variableValue) {
    try {
      const response = await this.octokit.rest.actions.createOrUpdateRepoVariable({
        owner,
        repo,
        name: variableName,
        value: variableValue,
      });

      const action = response.status === 201 ? 'Created' : 'Updated';
      printSuccess(`✅ ${action} GitHub repository variable: ${variableName}`);
      return response.data;
    } catch (error) {
      printError(`Failed to create/update GitHub repository variable: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get repository environments
   */
  async getEnvironments(owner, repo) {
    try {
      const response = await this.octokit.rest.repos.getAllEnvironments({
        owner,
        repo,
      });

      return response.data;
    } catch (error) {
      printError(`Failed to get GitHub repository environments: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create or update environment
   */
  async createOrUpdateEnvironment(owner, repo, environmentName, options = {}) {
    try {
      const response = await this.octokit.rest.repos.createOrUpdateEnvironment({
        owner,
        repo,
        environment_name: environmentName,
        wait_timer: options.waitTimer,
        reviewers: options.reviewers,
        deployment_branch_policy: options.deploymentBranchPolicy,
      });

      const action = response.status === 201 ? 'Created' : 'Updated';
      printSuccess(`✅ ${action} GitHub environment: ${environmentName}`);
      return response.data;
    } catch (error) {
      printError(`Failed to create/update GitHub environment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get repository vulnerability alerts
   */
  async getVulnerabilityAlerts(owner, repo) {
    try {
      const response = await this.octokit.rest.codeScanning.listAlertsForRepo({
        owner,
        repo,
      });

      return response.data;
    } catch (error) {
      // Vulnerability alerts might not be enabled
      if (error.status === 404) {
        return [];
      }
      printError(`Failed to get GitHub vulnerability alerts: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get repository dependabot alerts
   */
  async getDependabotAlerts(owner, repo, options = {}) {
    try {
      const response = await this.octokit.rest.dependabot.listAlertsForRepo({
        owner,
        repo,
        state: options.state,
        severity: options.severity,
        ecosystem: options.ecosystem,
      });

      return response.data;
    } catch (error) {
      // Dependabot alerts might not be enabled
      if (error.status === 404) {
        return [];
      }
      printError(`Failed to get GitHub dependabot alerts: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get repository security advisories
   */
  async getSecurityAdvisories(owner, repo) {
    try {
      const response = await this.octokit.rest.securityAdvisories.listRepoAdvisories({
        owner,
        repo,
      });

      return response.data;
    } catch (error) {
      printError(`Failed to get GitHub security advisories: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get repository insights (traffic, clones, views)
   */
  async getTrafficInsights(owner, repo) {
    try {
      // Get traffic data
      const [views, clones, referrers] = await Promise.allSettled([
        this.octokit.rest.repos.getViews({ owner, repo }),
        this.octokit.rest.repos.getClones({ owner, repo }),
        this.octokit.rest.repos.getTopReferrers({ owner, repo }),
      ]);

      const insights = {
        views: views.status === 'fulfilled' ? views.value.data : null,
        clones: clones.status === 'fulfilled' ? clones.value.data : null,
        referrers: referrers.status === 'fulfilled' ? referrers.value.data : null,
      };

      return insights;
    } catch (error) {
      printError(`Failed to get GitHub repository insights: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get repository activity (issues, PRs, commits over time)
   */
  async getActivityInsights(owner, repo) {
    try {
      // Get weekly commit activity
      const { data: weeklyActivity } = await this.octokit.rest.repos.getWeeklyCommitActivity({
        owner,
        repo,
      });

      // Get contributor activity
      const { data: contributorActivity } = await this.octokit.rest.repos.getCodeFrequency({
        owner,
        repo,
      });

      return {
        weeklyActivity,
        contributorActivity,
      };
    } catch (error) {
      printError(`Failed to get GitHub repository activity insights: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get repository health metrics
   */
  async getHealthMetrics(owner, repo) {
    try {
      const [repoData, contributors, languages, issues, pulls] = await Promise.all([
        this.getRepository(owner, repo),
        this.getContributors(owner, repo),
        this.getLanguages(owner, repo),
        this.getIssues(owner, repo, { state: 'open' }),
        this.getPullRequests(owner, repo, { state: 'open' }),
      ]);

      const metrics = {
        repository: {
          name: repoData.name,
          description: repoData.description,
          stars: repoData.stargazers_count,
          forks: repoData.forks_count,
          issues: repoData.open_issues_count,
          size: repoData.size,
          language: repoData.language,
          license: repoData.license?.name || 'None',
          createdAt: repoData.created_at,
          updatedAt: repoData.updated_at,
        },
        activity: {
          contributors: contributors.length,
          openIssues: issues.length,
          openPullRequests: pulls.length,
          languages: Object.keys(languages).length,
        },
      };

      return metrics;
    } catch (error) {
      printError(`Failed to get GitHub repository health metrics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate a security report for the repository
   */
  async generateSecurityReport(owner, repo) {
    try {
      const [vulnerabilities, dependabotAlerts, securityAdvisories, repoData] = await Promise.all([
        this.getVulnerabilityAlerts(owner, repo),
        this.getDependabotAlerts(owner, repo),
        this.getSecurityAdvisories(owner, repo),
        this.getRepository(owner, repo),
      ]);

      const report = {
        repository: repoData.name,
        summary: {
          totalVulnerabilities: vulnerabilities.length,
          totalDependabotAlerts: dependabotAlerts.length,
          totalSecurityAdvisories: securityAdvisories.length,
          hasVulnerabilityScanning: vulnerabilities.length > 0 || dependabotAlerts.length > 0,
        },
        vulnerabilities: vulnerabilities,
        dependabotAlerts: dependabotAlerts,
        securityAdvisories: securityAdvisories,
        recommendations: [],
      };

      // Add recommendations based on findings
      if (vulnerabilities.length > 0) {
        report.recommendations.push(
          'Enable GitHub Security Advisories to track and fix vulnerabilities'
        );
      }

      if (dependabotAlerts.length > 0) {
        report.recommendations.push('Regularly update dependencies to address security alerts');
      }

      if (!repoData.private && !repoData.security_and_analysis) {
        report.recommendations.push(
          'Enable security features like secret scanning and dependency review'
        );
      }

      return report;
    } catch (error) {
      printError(`Failed to generate GitHub security report: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a comprehensive project report
   */
  async generateProjectReport(owner, repo) {
    try {
      const [healthMetrics, trafficInsights, activityInsights, securityReport] = await Promise.all([
        this.getHealthMetrics(owner, repo),
        this.getTrafficInsights(owner, repo),
        this.getActivityInsights(owner, repo),
        this.generateSecurityReport(owner, repo),
      ]);

      const report = {
        project: healthMetrics.repository.name,
        health: healthMetrics,
        traffic: trafficInsights,
        activity: activityInsights,
        security: securityReport,
        generatedAt: new Date().toISOString(),
      };

      return report;
    } catch (error) {
      printError(`Failed to generate GitHub project report: ${error.message}`);
      throw error;
    }
  }
}

// Helper function to encrypt secrets (simplified)
async function encryptSecret(secretValue, publicKey) {
  await sodium.ready;
  const messageBytes = sodium.from_string(secretValue);
  const keyBytes = sodium.from_base64(publicKey, sodium.base64_variants.ORIGINAL);
  const encryptedBytes = sodium.crypto_box_seal(messageBytes, keyBytes);
  return sodium.to_base64(encryptedBytes, sodium.base64_variants.ORIGINAL);
}

/**
 * Validate GitHub configuration
 */
export async function validateGitHubConfig(config) {
  if (!config.token) {
    throw new Error('GitHub configuration requires token');
  }

  const client = new GitHubClient(config.token);

  try {
    // Test by fetching user information
    const response = await client.octokit.rest.users.getAuthenticated();

    if (response.status === 200) {
      printSuccess(`✅ GitHub connection validated for user: ${response.data.login}`);
      return true;
    } else {
      throw new Error(`GitHub connection test failed: ${response.status}`);
    }
  } catch (error) {
    printError(`❌ GitHub connection failed: ${error.message}`);
    return false;
  }
}

export default {
  GitHubClient,
  validateGitHubConfig,
};
