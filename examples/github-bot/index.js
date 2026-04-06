#!/usr/bin/env node

/**
 * Ultra-Dex GitHub Automation Bot
 * 
 * This example demonstrates how to create a GitHub automation bot using Ultra-Dex.
 * The bot can automatically review pull requests, manage issues, and enforce code quality.
 * 
 * Features:
 * - Pull request review automation
 * - Issue labeling and assignment
 * - Code quality checks
 * - Automated responses to common queries
 */

import { UltraDex } from '@ultra-dex/sdk';
import { Octokit } from '@octokit/rest';

class GitHubBot {
  constructor(config) {
    this.ultraDex = new UltraDex(config.ultraDex);
    this.github = new Octokit({ auth: config.githubToken });
    this.repo = config.repo; // Format: 'owner/repo'
    
    // Define specialized agents for different GitHub tasks
    this.agents = {
      codeReviewer: this.ultraDex.createAgent({
        name: 'code-reviewer',
        role: 'Reviews code changes for quality, security, and best practices',
        tools: ['git-diff-analyzer', 'security-scanner', 'style-checker']
      }),
      
      issueManager: this.ultraDex.createAgent({
        name: 'issue-manager',
        role: 'Manages GitHub issues by categorizing, labeling, and assigning',
        tools: ['issue-classifier', 'label-suggester', 'assignee-selector']
      }),
      
      documentationChecker: this.ultraDex.createAgent({
        name: 'documentation-checker',
        role: 'Verifies that code changes include appropriate documentation',
        tools: ['doc-parser', 'coverage-analyzer']
      }),
      
      releaseNotesGenerator: this.ultraDex.createAgent({
        name: 'release-notes-generator',
        role: 'Generates release notes based on commit messages and PR descriptions',
        tools: ['commit-analyzer', 'pr-summarizer']
      })
    };
  }

  /**
   * Handle a new pull request
   */
  async handlePullRequest(prNumber) {
    console.log(`Processing pull request #${prNumber}`);
    
    // Get PR details
    const { data: pr } = await this.github.pulls.get({
      owner: this.repo.split('/')[0],
      repo: this.repo.split('/')[1],
      pull_number: prNumber
    });
    
    // Get PR diff
    const { data: prDiff } = await this.github.pulls.get({
      owner: this.repo.split('/')[0],
      repo: this.repo.split('/')[1],
      pull_number: prNumber,
      mediaType: {
        format: 'diff'
      }
    });
    
    // Run code review
    const reviewResult = await this.agents.codeReviewer.execute({
      prTitle: pr.title,
      prDescription: pr.body,
      diff: prDiff,
      author: pr.user.login
    });
    
    // Post review comments
    if (reviewResult.comments && reviewResult.comments.length > 0) {
      await this.github.pulls.createReview({
        owner: this.repo.split('/')[0],
        repo: this.repo.split('/')[1],
        pull_number: prNumber,
        body: `## AI-Powered Code Review\n\n${reviewResult.summary}\n\n${reviewResult.comments.map(c => `- ${c}`).join('\n')}`,
        event: 'COMMENT',
        comments: reviewResult.lineComments || []
      });
    }
    
    // Check for documentation
    const docResult = await this.agents.documentationChecker.execute({
      diff: prDiff,
      title: pr.title
    });
    
    if (!docResult.hasDocumentation) {
      await this.github.issues.createComment({
        owner: this.repo.split('/')[0],
        repo: this.repo.split('/')[1],
        issue_number: prNumber,
        body: `⚠️ This PR appears to lack documentation updates. Please consider adding documentation for the new features or changes.`
      });
    }
    
    console.log(`Completed processing pull request #${prNumber}`);
  }

  /**
   * Handle a new issue
   */
  async handleIssue(issueNumber) {
    console.log(`Processing issue #${issueNumber}`);
    
    // Get issue details
    const { data: issue } = await this.github.issues.get({
      owner: this.repo.split('/')[0],
      repo: this.repo.split('/')[1],
      issue_number: issueNumber
    });
    
    // Classify and manage the issue
    const managementResult = await this.agents.issueManager.execute({
      title: issue.title,
      body: issue.body,
      author: issue.user.login,
      labels: issue.labels.map(l => l.name)
    });
    
    // Apply labels if suggested
    if (managementResult.suggestedLabels && managementResult.suggestedLabels.length > 0) {
      await this.github.issues.addLabels({
        owner: this.repo.split('/')[0],
        repo: this.repo.split('/')[1],
        issue_number: issueNumber,
        labels: managementResult.suggestedLabels
      });
    }
    
    // Assign to appropriate person if suggested
    if (managementResult.assignee) {
      await this.github.issues.addAssignees({
        owner: this.repo.split('/')[0],
        repo: this.repo.split('/')[1],
        issue_number: issueNumber,
        assignees: [managementResult.assignee]
      });
    }
    
    // Add comment if needed
    if (managementResult.comment) {
      await this.github.issues.createComment({
        owner: this.repo.split('/')[0],
        repo: this.repo.split('/')[1],
        issue_number: issueNumber,
        body: managementResult.comment
      });
    }
    
    console.log(`Completed processing issue #${issueNumber}`);
  }

  /**
   * Process all open PRs
   */
  async processOpenPRs() {
    const { data: pulls } = await this.github.pulls.list({
      owner: this.repo.split('/')[0],
      repo: this.repo.split('/')[1],
      state: 'open'
    });
    
    for (const pr of pulls) {
      await this.handlePullRequest(pr.number);
    }
  }

  /**
   * Process all open issues
   */
  async processOpenIssues() {
    const { data: issues } = await this.github.issues.listForRepo({
      owner: this.repo.split('/')[0],
      repo: this.repo.split('/')[1],
      state: 'open'
    });
    
    for (const issue of issues) {
      if (!issue.pull_request) { // Skip PRs (they have pull_request property)
        await this.handleIssue(issue.number);
      }
    }
  }

  /**
   * Start listening for GitHub events (webhook implementation)
   */
  async startWebhookListener(port = 3000) {
    const express = require('express');
    const bodyParser = require('body-parser');
    const crypto = require('crypto');
    
    const app = express();
    app.use(bodyParser.json());
    
    // GitHub webhook endpoint
    app.post('/webhook', async (req, res) => {
      const signature = req.headers['x-hub-signature-256'];
      const payload = JSON.stringify(req.body);
      
      // Verify webhook signature (simplified)
      // In production, implement proper signature verification
      
      if (req.body.action === 'opened' && req.body.pull_request) {
        // New pull request
        await this.handlePullRequest(req.body.pull_request.number);
      } else if (req.body.action === 'opened' && req.body.issue && !req.body.issue.pull_request) {
        // New issue
        await this.handleIssue(req.body.issue.number);
      } else if (req.body.action === 'synchronize' && req.body.pull_request) {
        // PR updated
        await this.handlePullRequest(req.body.pull_request.number);
      }
      
      res.status(200).send('OK');
    });
    
    app.listen(port, () => {
      console.log(`GitHub Bot listening on port ${port}`);
    });
  }
}

// Example usage
async function main() {
  const bot = new GitHubBot({
    ultraDex: {
      apiKey: process.env.ULTRA_DEX_API_KEY,
      endpoint: process.env.ULTRA_DEX_ENDPOINT || 'https://api.ultra-dex.ai'
    },
    githubToken: process.env.GITHUB_TOKEN,
    repo: process.env.GITHUB_REPO || 'your-org/your-repo' // Format: 'owner/repo'
  });
  
  // Process all open PRs and issues
  await bot.processOpenPRs();
  await bot.processOpenIssues();
  
  // Start webhook listener
  await bot.startWebhookListener(3000);
}

if (require.main === module) {
  main().catch(console.error);
}

export default GitHubBot;