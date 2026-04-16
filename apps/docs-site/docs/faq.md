# Frequently Asked Questions

## General

### What is Ultra-Dex?
Ultra-Dex is an AI orchestration meta-layer that routes tasks across 13+ providers, coordinates multi-agent swarms, and maintains persistent memory for software engineering workflows.

### How is Ultra-Dex different from other AI coding tools?
Unlike tools that focus on code completion, Ultra-Dex orchestrates entire development workflows. It manages context across tools, coordinates multiple AI agents, enforces quality standards, and integrates with 100+ services.

### Do I need to replace my existing tools?
No! Ultra-Dex works with your existing tools. It creates a unified layer that connects them all, enabling AI agents to work seamlessly across your entire tech stack.

## Installation & Setup

### What are the system requirements?
- Node.js version 18 or higher
- At least 4GB of free disk space
- Internet connection for AI API access
- Git for version control

### How do I install Ultra-Dex?
```bash
npm install -g ultra-dex
```

### What AI providers does Ultra-Dex support?
Ultra-Dex supports 13+ providers: OpenAI, Anthropic, Google Gemini, NVIDIA Nemotron, Mistral, Groq, DeepSeek, Cohere, Together AI, Fireworks, Perplexity, Grok, and Llama 4. The SmartRouter selects by cost, latency, or quality with automatic fallback chains.

## Usage

### How do I start a new project?
```bash
mkdir my-project
cd my-project
ultra-dex init
ultra-dex plan "Describe what you want to build"
ultra-dex run IMPLEMENTATION_PLAN.md
```

### How many commands does Ultra-Dex have?
Ultra-Dex includes 135+ commands organized into categories like planning, execution, verification, and integrations.

### Can Ultra-Dex work with my existing codebase?
Yes! Ultra-Dex can analyze and work with existing codebases. Use `ultra-dex context analyze` to understand your current project structure.

## AI & Agents

### How does the multi-agent system work?
Ultra-Dex coordinates specialized AI agents for different tasks (frontend, backend, testing, etc.) to work together on projects, similar to a human team.

### What is the verification process?
Ultra-Dex implements a 21-step verification protocol that checks code quality, security, performance, and alignment with your original requirements.

### How does context management work?
Ultra-Dex maintains project context in files like `CONTEXT.md` and `IMPLEMENTATION_PLAN.md`, ensuring all agents work with consistent information.

## Integrations

### Which services does Ultra-Dex integrate with?
Ultra-Dex integrates with 100+ services including GitHub, Jira, Stripe, Notion, Slack, Discord, Vercel, Supabase, and many more.

### How do I connect Ultra-Dex to my services?
Use the configuration commands:
```bash
ultra-dex config set GITHUB_TOKEN your-token
ultra-dex config set STRIPE_SECRET_KEY your-key
```

### Is my data secure?
Yes, Ultra-Dex follows security best practices. API keys are stored securely, and no code is sent to Ultra-Dex servers (only to your configured AI providers).

## Performance & Costs

### How much does Ultra-Dex cost?
Ultra-Dex is open source and free to use. You only pay for the AI API usage and any integrated services.

### How can I monitor AI API usage?
```bash
ultra-dex usage show
```

### Does Ultra-Dex cache results to reduce costs?
Yes, Ultra-Dex implements intelligent caching to avoid redundant API calls for similar operations.

## Troubleshooting

### What should I do if a command fails?
1. Run `ultra-dex doctor` for diagnostics
2. Use `--verbose` flag for more details
3. Check your API keys with `ultra-dex config show`
4. Review the troubleshooting guide

### How do I reset Ultra-Dex configuration?
```bash
ultra-dex config reset
```

## Enterprise

### Is there enterprise support?
Yes, enterprise support is available for larger teams with additional features like SSO, advanced governance, and priority support.

### Can I self-host Ultra-Dex?
Yes, Ultra-Dex can be deployed in your own infrastructure for enhanced security and compliance.

## Development

### How can I contribute to Ultra-Dex?
Check out the [CONTRIBUTING.md](https://github.com/Srujan0798/Ultra-Dex/blob/main/CONTRIBUTING.md) file in the repository for contribution guidelines.

### Where can I report bugs?
Report bugs on our GitHub repository issues page.

### How often is Ultra-Dex updated?
Ultra-Dex receives regular updates with new features, integrations, and improvements. Check the CHANGELOG for release notes.