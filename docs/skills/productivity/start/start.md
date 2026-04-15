---
name: start
description: Initialize the productivity system and open the dashboard. Use when setting up the plugin for the first time, bootstrapping working memory from your existing task list, or decoding the shorthand (nicknames, acronyms, project codenames) you use in your todos.
user-invocable: true
---

# Start - Productivity System Initialization

Initialize the productivity system and open the dashboard. Use when setting up the plugin for the first time, bootstrapping working memory from your existing task list, or decoding the shorthand (nicknames, acronyms, project codenames) you use in your todos.

## Trigger

- **Slash command:** `/productivity:start`
- **Auto-trigger:** When Claude detects first interaction with task list or memory system

## What This Skill Does

The `/productivity:start` command bootstraps the entire productivity system:

1. **Scans your existing context** (chat, calendar, email, documents)
2. **Extracts people, projects, and terminology**
3. **Builds the initial glossary** from your internal language
4. **Populates CLAUDE.md** with your hot cache
5. **Creates the memory/ directory structure**
6. **Opens the dashboard** for visual task management

## When to Use

- **First-time setup:** Setting up the plugin for the first time
- **Bootstrap from tasks:** You have an existing task list and want Claude to learn from it
- **Decode shorthand:** Your todos use nicknames, acronyms, or project codenames that need decoding
- **Re-initialize:** System needs a refresh after major changes

## Initialization Flow

```
User: /productivity:start
         ↓
1. Scan existing context
   - Chat history (Slack, Teams, etc.)
   - Calendar events (last 30 days)
   - Email threads (active conversations)
   - Documents (recent files, wikis)
         ↓
2. Extract entities
   - People → names, roles, communication preferences
   - Projects → codenames, status, key stakeholders
   - Terms → acronyms, shorthand, internal language
         ↓
3. Build glossary
   - Create memory/glossary.md with all extracted terms
   - Identify top 30 people for CLAUDE.md
   - Identify top 30 terms for CLAUDE.md
   - Identify active projects for CLAUDE.md
         ↓
4. Populate CLAUDE.md
   - Create/update CLAUDE.md in project root
   - Add Key People table (top 30)
   - Add Terms table (top 30)
   - Add Active Projects table
   - Add Preferences section
         ↓
5. Create memory/ structure
   - memory/glossary.md (full decoder ring)
   - memory/people/ (individual profiles)
   - memory/projects/ (project details)
   - memory/context/ (company, teams, tools)
         ↓
6. Open dashboard
   - Display task overview
   - Show memory status
   - Present quick start commands
```

## Output Format

After initialization, Claude provides:

```markdown
# Productivity System Initialized ✅

## What I Learned

**People:** [X] contacts extracted, [Y] added to hot cache
**Projects:** [X] active projects identified
**Terms:** [X] acronyms/terms decoded

## Quick Reference

### Key People (Hot Cache)
| Who | Role |
|-----|------|
| [Name] | [Role] |
...

### Active Projects
| Project | Status |
|---------|--------|
| [Name] | [Status] |
...

### Common Terms
| Term | Meaning |
|------|---------|
| [Acronym] | [Definition] |
...

## Next Steps

1. Review and edit CLAUDE.md (add/remove people, terms)
2. Fill in missing details in memory/people/ profiles
3. Start using natural language - I'll decode it!
4. Run `/tasks` to see your task dashboard
```

## Dashboard Contents

The productivity dashboard shows:

### Task Management
- Current tasks (from TASKS.md or integrated system)
- Priority breakdown (P0, P1, P2)
- Recent completions
- Overdue items

### Memory Status
- CLAUDE.md last updated
- Glossary size (number of terms)
- People profiles count
- Recent memory updates

### Quick Actions
- Add new task
- Update memory
- Review glossary
- Export context

## Shorthand Decoding

During initialization, Claude learns to decode your shorthand:

### Examples of What Gets Decoded

| Your Shorthand | What Claude Learns |
|----------------|-------------------|
| "ask todd" | Todd Martinez, Finance lead, prefers Slack |
| "PSR" | Pipeline Status Report (weekly sales doc) |
| "phoenix" | Project Phoenix - DB migration, Q2 launch |
| "the migration" | Also refers to Project Phoenix |
| "T" | Nickname for Todd Martinez |
| "ship it" | Deploy to production |
| "P0" | Drop everything priority |

### How Decoding Works

```
User says: "ask todd to do the PSR for phoenix"

Claude decodes:
  "todd" → Todd Martinez (from CLAUDE.md Key People)
  "PSR" → Pipeline Status Report (from CLAUDE.md Terms)
  "phoenix" → Project Phoenix (from CLAUDE.md Active Projects)

Full understanding: "Ask Todd Martinez to prepare the
Pipeline Status Report for Project Phoenix"
```

## Configuration Options

### Task Source
Specify where your tasks live:
- `TASKS.md` (default - shared markdown file)
- Linear (project management tool)
- Jira (issue tracker)
- Asana (task management)
- Custom (provide your own format)

### Memory Depth
Control how much context to extract:
- `minimal` - Just top 10 people/terms
- `standard` - Top 30 (recommended)
- `comprehensive` - Everything found

### Dashboard Type
Choose your dashboard:
- `notion` - Notion page (default)
- `markdown` - Local markdown files
- `cli` - Terminal-based view

## Post-Initialization Commands

After running `/productivity:start`, use these commands:

| Command | Action |
|---------|--------|
| `/tasks` | View current tasks |
| `/memory` | View memory context |
| `/tasks:add "description"` | Add new task |
| `/tasks:complete "task"` | Mark task done |
| `/memory:add "X means Y"` | Teach new term |
| `/memory:review` | Review glossary |
| `/productivity:dashboard` | Open dashboard |
| `/productivity:update` | Update from recent activity |

## Troubleshooting

### "I don't have enough context yet"
- Claude will work with what's available
- Start using the system - it learns as you go
- Manually add terms with `/memory:add`

### "Too many people/terms found"
- Edit CLAUDE.md to remove irrelevant entries
- Use the "hot 30" rule - keep only frequent contacts
- Demote stale items to memory/ only

### "Shorthand not being decoded"
- Check if term exists in CLAUDE.md or memory/glossary.md
- Add missing terms with `/memory:add`
- Ensure nicknames are captured in people profiles

## Conventions

- **CLAUDE.md** stays in project root (hot cache)
- **memory/** directory for deep storage
- **Filenames:** lowercase, hyphens (`todd-martinez.md`)
- **Always capture** nicknames and alternate names
- **Promote** frequently used items to CLAUDE.md
- **Demote** stale items to memory/ only

## Related Skills

- `/productivity:task-management` - Manage tasks and todos
- `/productivity:memory-management` - Two-tier memory system
- `/productivity:update` - Update from recent activity

---

**Use `/productivity:start` to bootstrap your productivity system and start working with Claude as a true collaborator who speaks your language.**
