# Ultra-Dex Code Review Bot

Automated GitHub/GitLab PR review bot with security + performance signals.

## Features
- Webhook-driven PR reviews
- Security and performance heuristics
- Auto-comment feedback

## Run
```bash
cd bots/code-review
npm install
node server.js
```

Set environment variables:
- `GITHUB_TOKEN`
- `GITLAB_TOKEN`
- `WEBHOOK_SECRET`
