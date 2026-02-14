# GitHub Automation Bot Example

This example demonstrates how to create a GitHub automation bot using Ultra-Dex that can automatically review pull requests, manage issues, and enforce code quality.

## Features

- **Pull Request Reviews**: Automatically reviews code changes for quality, security, and best practices
- **Issue Management**: Categorizes, labels, and assigns issues based on content
- **Documentation Checking**: Verifies that code changes include appropriate documentation
- **Webhook Integration**: Listens for GitHub events and responds automatically

## Prerequisites

- Node.js 18+
- Ultra-Dex API key
- GitHub personal access token with appropriate permissions
- GitHub repository with webhook configured

## Setup

1. **Install Dependencies**:
   ```bash
   npm install @octokit/rest express body-parser
   ```

2. **Environment Variables**:
   Create a `.env` file with the following:
   ```env
   ULTRA_DEX_API_KEY=your_ultra_dex_api_key
   ULTRA_DEX_ENDPOINT=https://api.ultra-dex.ai
   GITHUB_TOKEN=your_github_personal_access_token
   GITHUB_REPO=owner/repo
   ```

3. **Run the Bot**:
   ```bash
   node index.js
   ```

## Configuration

The bot uses several specialized agents:

- `code-reviewer`: Reviews code changes for quality, security, and best practices
- `issue-manager`: Manages GitHub issues by categorizing, labeling, and assigning
- `documentation-checker`: Verifies that code changes include appropriate documentation
- `release-notes-generator`: Generates release notes based on commit messages

## Webhook Setup

To receive real-time notifications from GitHub:

1. Go to your repository settings
2. Navigate to "Webhooks"
3. Add a new webhook pointing to your server's `/webhook` endpoint
4. Select the events you want to trigger the webhook (pull requests, issues)

## Usage

Once running, the bot will:

1. Process all existing open pull requests and issues
2. Listen for new events via webhooks
3. Automatically review code, manage issues, and provide feedback

## Customization

You can customize the bot's behavior by modifying:

- Agent prompts and instructions
- Response templates
- Labeling and assignment logic
- Quality thresholds and checks

## Security

- Store API keys securely using environment variables
- Implement proper webhook signature verification in production
- Use fine-grained GitHub tokens with minimal required permissions