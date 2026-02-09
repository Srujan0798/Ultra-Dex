# GitHub Integration Guide

The Ultra-Dex GitHub integration enables seamless repository management, issue tracking, pull request automation, and CI/CD orchestration within your development workflow.

## Setup

### Prerequisites
- GitHub account with repository access
- Personal Access Token (PAT) with appropriate scopes
- Or GitHub App with necessary permissions

### Configuration
```bash
# Set your GitHub token
ultra-dex config set GITHUB_TOKEN ghp_...

# Or configure GitHub App
ultra-dex config set GITHUB_APP_ID your_app_id
ultra-dex config set GITHUB_PRIVATE_KEY "-----BEGIN RSA PRIVATE KEY-----..."
ultra-dex config set GITHUB_INSTALLATION_ID your_installation_id
```

### Environment Variables
```env
GITHUB_TOKEN=ghp_your_personal_access_token
GITHUB_APP_ID=your_github_app_id
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----..."
GITHUB_INSTALLATION_ID=your_installation_id
```

## Features

### Repository Management
```bash
# Create a new repository
ultra-dex github repo create --name my-project --private

# Clone a repository
ultra-dex github repo clone owner/repo-name

# Get repository information
ultra-dex github repo info owner/repo-name
```

### Issue Management
```bash
# Create an issue
ultra-dex github issue create --repo owner/repo-name --title "Bug Report" --body "Description here"

# List open issues
ultra-dex github issue list --repo owner/repo-name --state open

# Assign an issue to a user
ultra-dex github issue assign --issue-number 123 --assignee username
```

### Pull Request Automation
```bash
# Create a pull request
ultra-dex github pr create --repo owner/repo-name --title "Feature" --body "Description" --head branch-name --base main

# List pull requests
ultra-dex github pr list --repo owner/repo-name --state open

# Merge a pull request
ultra-dex github pr merge --pr-number 456 --method squash
```

### Branch Operations
```bash
# Create a branch
ultra-dex github branch create --repo owner/repo-name --branch-name feature/new-feature --source main

# Delete a branch
ultra-dex github branch delete --repo owner/repo-name --branch-name feature/old-feature
```

### Release Management
```bash
# Create a release
ultra-dex github release create --repo owner/repo-name --tag v1.0.0 --title "Version 1.0.0" --notes "Release notes here"

# List releases
ultra-dex github release list --repo owner/repo-name
```

## CI/CD Integration

The GitHub integration supports automated workflows:

```bash
# Trigger a workflow
ultra-dex github workflow dispatch --repo owner/repo-name --workflow deploy.yml --ref main

# Check workflow status
ultra-dex github workflow status --repo owner/repo-name --run-id 123456
```

## CLI Commands

### Main GitHub Commands
- `ultra-dex github repo` - Manage repositories
- `ultra-dex github issue` - Manage issues
- `ultra-dex github pr` - Manage pull requests
- `ultra-dex github branch` - Manage branches
- `ultra-dex github release` - Manage releases
- `ultra-dex github workflow` - Manage workflows
- `ultra-dex github label` - Manage labels
- `ultra-dex github milestone` - Manage milestones

### Examples

Automate a complete feature workflow:
```bash
# Create a new branch for the feature
ultra-dex github branch create --repo myorg/myrepo --branch-name feature/user-auth --source main

# Create an issue for the feature
ISSUE_URL=$(ultra-dex github issue create --repo myorg/myrepo --title "Implement User Authentication" --body "Add login and registration functionality" | jq -r '.url')

# Later, create a PR when the feature is ready
PR_URL=$(ultra-dex github pr create --repo myorg/myrepo --title "feat: Add user authentication" --body "Closes $ISSUE_URL" --head feature/user-auth --base main | jq -r '.url')

echo "Created PR: $PR_URL"
```

## Webhook Handling

The GitHub integration can handle common webhook events:

- `push` - Code pushed to repository
- `pull_request.opened` - New pull request created
- `pull_request.closed` - Pull request merged or closed
- `issues.opened` - New issue created
- `release.published` - New release published

## Error Handling

The integration includes robust error handling:

- Rate limiting with exponential backoff
- Invalid token detection
- Repository access validation
- Detailed error messages with remediation suggestions

## Monitoring & Logging

All GitHub operations are logged in the Ultra-Dex ledger:
```bash
# View recent GitHub operations
ultra-dex ledger view --service github --last 10

# Monitor GitHub API rate limit
ultra-dex github health check
```

## Best Practices

1. **Secure Token Storage**: Store tokens in environment variables or secure vault
2. **Minimal Permissions**: Use tokens with minimal required permissions
3. **Branch Protection**: Respect branch protection rules
4. **Rate Limits**: Be mindful of GitHub API rate limits (5000 requests/hour for authenticated requests)
5. **Automation Labels**: Use labels to track automated changes
6. **Pull Request Templates**: Leverage PR templates for consistency