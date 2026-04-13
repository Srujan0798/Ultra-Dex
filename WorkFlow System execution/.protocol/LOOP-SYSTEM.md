# Ultra-Dex Automation Loop System

## The Loop

```
.kimi (prompts/consciousness)
  → .protocol/state (dispatches)
    → Agents implement from dispatches
      → Version marked complete, tag release
        → Marketing posts for validation
          → Feedback collected
            → New .kimi prompts generated
              → Loop repeats
```

## Directory Separation Rules

These rules are **enforced** — any agent or process that violates them is misconfigured.

| Directory    | ONLY contains                                    | NEVER contains                        |
|-------------|--------------------------------------------------|---------------------------------------|
| `.kimi/`    | Consciousness, memory, prompt templates          | Execution plans, dispatches, code     |
| `.protocol/`| Orchestration, execution, state dispatches       | Documentation, marketing, code        |
| `docs/`     | Markdown documentation                           | Source code (.js/.ts), test files      |
| `src/`      | Source code                                      | Documentation, marketing, tests       |
| `tests/`    | Test files                                       | Source code, documentation            |
| `marketing/`| Posts, tracking, validation, templates           | Source code, execution plans          |
| `packages/` | Published packages                               | Duplicates, debug artifacts           |
| `apps/`     | Application implementations                     | Tests, documentation                  |
| Root `/`    | README, CLAUDE.md, CHANGELOG, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, package.json, configs | Test files, debug dirs, excess docs |

## Stored Repeating Instructions

### Marketing / Reddit Post Generation

When generating Reddit posts, the system MUST automatically apply these rules without the user repeating them:

1. **Generate 12-15 different posts** for different communities
2. **Follow EACH community's specific rules** — do NOT apply the same rules to all communities
3. **Reference `marketing/validation/RULES-ENGINE.json`** for subreddit-specific rule checks
4. **Reference `marketing/validation/TEMPLATES-BY-SUBREDDIT.md`** for community-specific templates
5. **Reference `marketing/validation/SUBREDDIT-TARGETING.md`** for targeting strategy
6. **Apply all previously given writing/prompt instructions** automatically on every new request
7. **Track responses** in `marketing/validation/response-tracker.md`

### Version Dispatch Workflow

When a new version dispatch is created:

1. Create dispatch file in `.protocol/state/` following naming: `v{XX}-{phase}-dispatches.md`
2. Reference agent capabilities from `.protocol/agent-capabilities/`
3. Use execution settings from `.protocol/ai-settings/`
4. Follow orchestration rules from `.protocol/orchestration.md`
5. Follow execution flow from `.protocol/execution.md`

### Prompt Generation (via .kimi)

When generating prompts:

1. Check `.kimi/CONSCIOUSNESS.md` for awareness context
2. Check `.kimi/memory/` for workflow roles and prior context
3. Use `.protocol` format for dispatching
4. Reference `docs/skills/` if skill-specific prompts needed
5. Generate complete prompts — user should never need to repeat base instructions

## Anti-Patterns (What NOT to Do)

- Do NOT create isolated loops — only ONE clean system loop runs for the entire project
- Do NOT assign marketing/posting tasks through `.kimi/` — use `marketing/` directly
- Do NOT store execution state in `.kimi/` — that goes in `.protocol/state/`
- Do NOT put source code in `docs/` — use `src/` or `archive/`
- Do NOT create " 2" duplicate files — if a file exists, edit it
- Do NOT leave debug/test directories in root — clean up after debugging
