// apps/github-integration/index.js
import express from 'express';
import { createProbot } from 'probot';
import { ultraDexClient } from '../src/client/ultra-dex-client.js';

const app = express();

// GitHub App configuration
const githubApp = createProbot({
  appId: process.env.GITHUB_APP_ID,
  privateKey: process.env.GITHUB_PRIVATE_KEY,
  webhooks: {
    secret: process.env.GITHUB_WEBHOOK_SECRET
  }
});

// Initialize Ultra-Dex client
const ultraDex = new ultraDexClient({
  apiKey: process.env.ULTRA_DEX_API_KEY,
  endpoint: process.env.ULTRA_DEX_ENDPOINT
});

// Webhook endpoints
app.post('/webhook', githubApp.webhooks.middleware());

// PR review automation
githubApp.on('pull_request.opened', async (context) => {
  const { pull_request: pr, repository } = context.payload;
  
  try {
    // Analyze PR with Ultra-Dex
    const analysis = await ultraDex.analyzeCode(pr.diff_url, {
      repository: repository.full_name,
      pullRequestId: pr.number,
      title: pr.title,
      description: pr.body
    });

    // Post review comments
    if (analysis.comments && analysis.comments.length > 0) {
      for (const comment of analysis.comments) {
        await context.octokit.pulls.createReviewComment({
          owner: repository.owner.login,
          repo: repository.name,
          pull_number: pr.number,
          commit_id: pr.head.sha,
          body: comment.body,
          path: comment.path,
          line: comment.line
        });
      }
    }

    // Post summary comment
    const summary = `## 🤖 Ultra-Dex AI Code Review\n\n${analysis.summary}`;
    await context.octokit.issues.createComment({
      owner: repository.owner.login,
      repo: repository.name,
      issue_number: pr.number,
      body: summary
    });

  } catch (error) {
    console.error('Error processing PR:', error);
  }
});

// Issue automation
githubApp.on('issues.opened', async (context) => {
  const { issue, repository } = context.payload;
  
  try {
    // Analyze issue with Ultra-Dex
    const analysis = await ultraDex.analyzeIssue({
      title: issue.title,
      body: issue.body,
      repository: repository.full_name,
      issueNumber: issue.number
    });

    // Add labels and assignees
    if (analysis.labels && analysis.labels.length > 0) {
      await context.octokit.issues.addLabels({
        owner: repository.owner.login,
        repo: repository.name,
        issue_number: issue.number,
        labels: analysis.labels
      });
    }

    if (analysis.assignee) {
      await context.octokit.issues.addAssignees({
        owner: repository.owner.login,
        repo: repository.name,
        issue_number: issue.number,
        assignees: [analysis.assignee]
      });
    }

  } catch (error) {
    console.error('Error processing issue:', error);
  }
});

// Commit analysis
githubApp.on('push', async (context) => {
  const { ref, commits, repository } = context.payload;
  
  try {
    // Analyze commits with Ultra-Dex
    const analysis = await ultraDex.analyzeCommits({
      commits,
      repository: repository.full_name,
      branch: ref.replace('refs/heads/', '')
    });

    // Post analysis as commit comment or status
    if (analysis.issues && analysis.issues.length > 0) {
      for (const issue of analysis.issues) {
        await context.octokit.repos.createCommitComment({
          owner: repository.owner.login,
          repo: repository.name,
          commit_sha: issue.commitSha,
          body: `⚠️ Potential issue detected: ${issue.description}`
        });
      }
    }

  } catch (error) {
    console.error('Error processing push:', error);
  }
});

// Repository setup
githubApp.on('repository.created', async (context) => {
  const { repository } = context.payload;
  
  try {
    // Set up Ultra-Dex for new repository
    await ultraDex.setupRepository({
      repository: repository.full_name,
      webhookUrl: `${process.env.WEBHOOK_BASE_URL}/webhook`,
      installationId: context.payload.installation.id
    });

  } catch (error) {
    console.error('Error setting up repository:', error);
  }
});

// Export the probot instance
export default githubApp;

// Start the server if run directly
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`GitHub integration server running on port ${port}`);
  });
}