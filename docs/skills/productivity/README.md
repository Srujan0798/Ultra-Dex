# Productivity

> **Source:** Marketplace (Anthropic & Partners)
> **Version:** 1.2.0
> **Author:** Anthropic
> **Verified:** Anthropic Verified
> **Tier:** 2 — Next Stage
> **Install when:** Calendar/task management overhead becomes a bottleneck
> **Skills:** 4
> **Connectors:** 10 — slack, notion, asana, linear, atlassian, ms365, monday, clickup, google-calendar, gmail
> **Install:** [Claude Cowork](https://claude.ai/redirect/claudedotcom.v1.cd205027-b086-4e65-9180-ec8b914abe62/desktop/customize/plugins/new?marketplace=anthropics/knowledge-work-plugins&plugin=productivity)
> **View:** [claude.com/plugins/productivity](https://claude.com/plugins/productivity)

## Description

Productivity gives Claude a persistent understanding of your work through task management, workplace memory, and a visual dashboard. Claude learns your people, projects, and terminology so it acts like a colleague, not a chatbot.

The plugin manages a markdown task list that Claude reads, writes, and executes against. Add tasks naturally in conversation and Claude tracks status, triages stale items, and syncs with external tools. A two-tier memory system teaches Claude your shorthand — say "ask todd to do the PSR for oracle" and Claude knows exactly who, what, and which deal.

Use `/start` to initialize tasks, memory, and the visual dashboard. Use `/update` for quick triage of stale items and memory gap checks, or `/update --comprehensive` for a deep scan of email, calendar, and chat to surface missed todos and suggest new memories.

Connect your chat, email, calendar, knowledge base, and project tracker via MCP for automatic action item discovery and task syncing.

## Skills

Invoke by typing `/` in chat, or let Claude use them automatically for relevant tasks.

### `/memory-management`
Two-tier memory system that makes Claude a true workplace collaborator. Decodes shorthand, acronyms, nicknames, and internal language so Claude understands requests like a colleague would. CLAUDE.md for working memory, memory/ directory for the full knowledge base.

### `/start`
Initialize the productivity system and open the dashboard. Use when setting up the plugin for the first time, bootstrapping working memory from your existing task list, or decoding the shorthand (nicknames, acronyms, project codenames) you use in your todos.

### `/task-management`
Simple task management using a shared TASKS.md file. Reference this when the user asks about their tasks, wants to add/complete tasks, or needs help tracking commitments.

### `/update`
Sync tasks and refresh memory from your current activity. Use when pulling new assignments from your project tracker into TASKS.md, triaging stale or overdue tasks, filling memory gaps for unknown people or projects, or running a comprehensive scan to catch todos buried in chat and email.

## Try Asking

- Set up my task and memory system
- Catch me up and triage stale tasks
- What's on my plate today?
- Remember key context about a project

## Reports

See `docs/skills-reports/productivity/` for all generated outputs.
