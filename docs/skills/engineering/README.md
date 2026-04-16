# Engineering

> **Source:** Marketplace (Anthropic & Partners)
> **Version:** 1.2.0
> **Author:** Anthropic
> **Verified:** Anthropic Verified
> **Tier:** 1 — Active Now
> **Skills:** 10
> **Connectors:** 10 — slack, linear, asana, atlassian, notion, github, pagerduty, datadog, google-calendar, gmail
> **Install:** [Claude Cowork](https://claude.ai/redirect/claudedotcom.v1.cd205027-b086-4e65-9180-ec8b914abe62/desktop/customize/plugins/new?marketplace=anthropics/knowledge-work-plugins&plugin=engineering)
> **View:** [claude.com/plugins/engineering](https://claude.com/plugins/engineering)

## Description

Streamline engineering workflows — standups, code review, architecture decisions, incident response, and technical documentation.

You can use Engineering to:

- **Code Review:** "Review this pull request and flag potential issues with error handling and performance"
- **Architecture Decision:** "Draft an ADR for migrating our monolith to microservices"
- **Incident Response:** "Write a post-mortem for yesterday's database outage with root cause analysis"
- **Standup Summary:** "Summarize our team's recent commits and PRs into a standup update"

## Skills

Invoke by typing `/` in chat, or let Claude use them automatically for relevant tasks.

### `/architecture`
Create or evaluate an architecture decision record (ADR). Use when choosing between technologies (e.g., Kafka vs SQS), documenting a design decision with trade-offs and consequences, reviewing a system design proposal, or designing a new component from requirements and constraints.

### `/code-review`
Review code changes for security, performance, and correctness. Trigger with a PR URL or diff, "review this before I merge", "is this code safe?", or when checking a change for N+1 queries, injection risks, missing edge cases, or error handling gaps.

### `/debug`
Structured debugging session — reproduce, isolate, diagnose, and fix. Trigger with an error message or stack trace, "this works in staging but not prod", "something broke after the deploy", or when behavior diverges from expected and the cause isn't obvious.

### `/deploy-checklist`
Pre-deployment verification checklist. Use when about to ship a release, deploying a change with database migrations or feature flags, verifying CI status and approvals before going to production, or documenting rollback triggers ahead of time.

### `/documentation`
Write and maintain technical documentation. Trigger with "write docs for", "document this", "create a README", "write a runbook", "onboarding guide", or when the user needs help with any form of technical writing — API docs, architecture docs, or operational runbooks.

### `/incident-response`
Run an incident response workflow — triage, communicate, and write postmortem. Trigger with "we have an incident", "production is down", an alert that needs severity assessment, a status update mid-incident, or when writing a blameless postmortem after resolution.

### `/standup`
Generate a standup update from recent activity. Use when preparing for daily standup, summarizing yesterday's commits and PRs and ticket moves, formatting work into yesterday/today/blockers, or structuring a few rough notes into a shareable update.

### `/system-design`
Design systems, services, and architectures. Trigger with "design a system for", "how should we architect", "system design for", "what's the right architecture for", or when the user needs help with API design, data modeling, or service boundaries.

### `/tech-debt`
Identify, categorize, and prioritize technical debt. Trigger with "tech debt", "technical debt audit", "what should we refactor", "code health", or when the user asks about code quality, refactoring priorities, or maintenance backlog.

### `/testing-strategy`
Design test strategies and test plans. Trigger with "how should we test", "test strategy for", "write tests for", "test plan", "what tests do we need", or when the user needs help with testing approaches, coverage, or test architecture.

## Try Asking

- Generate my standup update from recent activity
- Review a PR for security and correctness
- Write an architecture decision record
- Run an incident response workflow
- Audit our codebase for tech debt priorities

## Reports

See `docs/skills-reports/engineering/` for all generated outputs.
