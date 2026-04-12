# Ultra-Dex Plugin Publishing Guide

> How to create, test, and publish plugins to the Ultra-Dex Marketplace.

---

## Table of Contents

- [Plugin Format Specification](#plugin-format-specification)
- [Step-by-Step Publishing Walkthrough](#step-by-step-publishing-walkthrough)
- [Best Practices for Plugin Design](#best-practices-for-plugin-design)
- [Versioning and Compatibility](#versioning-and-compatibility)
- [Review and Moderation Policy](#review-and-moderation-policy)

---

## Plugin Format Specification

### Required Files

Every plugin must include:

| File | Required | Description |
|---|---|---|
| `agent.json` | Yes | Plugin manifest with metadata and capabilities |
| `prompt.md` | Yes | System prompt that defines the agent's behavior |
| `README.md` | Yes | User-facing documentation |
| `index.ts` or `index.js` | Yes | Plugin entry point (for tool plugins) |

### agent.json Schema

```json
{
  "id": "unique-plugin-id",
  "name": "Human Readable Name",
  "role": "agent-role",
  "description": "One-line description of what this plugin does",
  "capabilities": ["capability-1", "capability-2"],
  "version": "1.0.0",
  "provider": "claude",
  "model": "claude-sonnet-4",
  "promptFile": "./prompt.md",
  "tools": ["tool-1", "tool-2"],
  "dependencies": ["other-plugin-id"]
}
```

### Field Reference

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | Yes | Unique lowercase-hyphenated identifier |
| `name` | string | Yes | Display name for the marketplace |
| `role` | string | Yes | Agent role category |
| `description` | string | Yes | Short description (max 200 chars) |
| `capabilities` | string[] | Yes | List of capability tags |
| `version` | string | Yes | Semantic version |
| `provider` | string | No | Default AI provider |
| `model` | string | No | Default model |
| `promptFile` | string | No | Path to system prompt |
| `tools` | string[] | No | Tool names this plugin provides |
| `dependencies` | string[] | No | Other plugin IDs required |

---

## Step-by-Step Publishing Walkthrough

### Step 1: Scaffold Your Plugin

```bash
mkdir my-plugin
cd my-plugin
```

Create the minimum viable plugin:

```
my-plugin/
├── agent.json
├── prompt.md
└── README.md
```

### Step 2: Define Your Agent

Write `agent.json`:

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "role": "custom",
  "description": "Does something useful",
  "capabilities": ["my-capability"],
  "version": "1.0.0"
}
```

### Step 3: Write the System Prompt

Write `prompt.md` — this is the most important file. It defines how the agent behaves:

```markdown
You are an expert in [domain]. When given a task:

1. Analyze the input carefully
2. [Step 2 of your process]
3. [Step 3 of your process]

For each output, include:
- Clear, actionable results
- Reasoning for your decisions
- Code examples where applicable
```

### Step 4: Test Locally

```bash
# Copy plugin to Ultra-Dex plugins directory
cp -r my-plugin ~/.ultra-dex/plugins/

# Run with your plugin
ultra-dex run my-plugin-id -t "Test task"
```

### Step 5: Write Documentation

Your `README.md` should include:

- What the plugin does
- Configuration options
- Example usage
- Known limitations

### Step 6: Submit to Marketplace

```bash
ultra-dex marketplace publish --plugin ./my-plugin
```

This validates your plugin against the schema and submits it for review.

---

## Best Practices for Plugin Design

### 1. Single Responsibility

Each plugin should do **one thing well**. Don't combine code review + test generation + deployment into one plugin.

### 2. Clear Capabilities

Use specific capability tags that help the orchestrator match your plugin to tasks:

```json
"capabilities": ["code-review", "security-audit"]
```

Not:

```json
"capabilities": ["everything", "code", "ai"]
```

### 3. Descriptive Prompts

Your `prompt.md` is the brain of your plugin. Be specific:

- Define the role clearly
- List the steps the agent should follow
- Specify the output format
- Include examples of good output

### 4. Handle Edge Cases

In your prompt, tell the agent what to do with:

- Empty input
- Invalid input
- Very large input
- Ambiguous requests

### 5. Version Carefully

Follow semantic versioning:

- **Major** — Breaking changes to output format or behavior
- **Minor** — New capabilities added
- **Patch** — Bug fixes, prompt improvements

---

## Versioning and Compatibility

### Compatibility Matrix

| Ultra-Dex Version | Plugin API Version | Compatible Plugins |
|---|---|---|
| 5.x | v1 | All v1 plugins |
| 6.x | v1 | All v1 plugins |
| 7.x | v2 | v2 plugins (v1 via compatibility layer) |

### Declaring Compatibility

```json
{
  "id": "my-plugin",
  "version": "1.0.0",
  "minUltraDexVersion": "5.0.0",
  "maxUltraDexVersion": "6.x"
}
```

### Migration Guide

When releasing a major version bump:

1. Document breaking changes in `CHANGELOG.md`
2. Provide a migration guide in `MIGRATION.md`
3. Keep the old version available for one release cycle

---

## Review and Moderation Policy

### Submission Review Process

1. **Automated Validation** — Schema check, required files present
2. **Content Review** — Prompt quality, capability accuracy
3. **Security Scan** — No malicious code, no data exfiltration
4. **Functional Test** — Plugin runs successfully with mock input

### Rejection Reasons

- Vague or misleading description
- Prompt contains harmful instructions
- Duplicate of existing plugin with no differentiation
- Security concerns (data collection without disclosure)
- Broken manifest schema

### Appeal Process

If your plugin is rejected:

1. Review the rejection reason (provided in email)
2. Fix the identified issues
3. Resubmit with a note explaining changes
4. Second review within 48 hours

### Plugin Removal

Plugins may be removed if:

- Security vulnerability discovered
- Author requests removal
- Violates marketplace terms of service
- Abandoned (no updates for 12+ months with reported issues)

Removed plugins receive a 30-day notice before removal from the marketplace.
