# Ultra-Dex CLI v2 Roadmap

> New commands for AI Orchestration

---

## New Commands Overview

| Command | Purpose | Phase |
|---------|---------|-------|
| `ultra-dex generate <idea>` | AI fills all 34 sections from idea | v2.0 |
| `ultra-dex build` | Start AI-assisted dev with context | v2.1 |
| `ultra-dex review` | Audit code against plan | v2.2 |
| `ultra-dex align` | Check alignment score | v2.2 |

---

## Command: `ultra-dex generate`

### Purpose
Transform a one-sentence idea into a complete 34-section implementation plan.

### Usage
```bash
# Interactive mode
ultra-dex generate

# With idea
ultra-dex generate "A task management SaaS for remote teams"

# With options
ultra-dex generate "idea" --provider claude --output ./my-project
```

### Options
| Option | Description | Default |
|--------|-------------|---------|
| `--provider` | AI provider (claude, openai, gemini) | claude |
| `--output, -o` | Output directory | current |
| `--model` | Specific model to use | provider default |
| `--key` | API key (or use env var) | env var |

### Flow
```
1. User provides idea
2. Ultra-Dex calls AI with template structure
3. AI fills all 34 sections contextually
4. Generated plan saved to output directory
5. Cursor rules automatically configured
```

### Output Files
```
my-project/
├── IMPLEMENTATION-PLAN.md    # Full 34-section plan (AI-generated)
├── QUICK-START.md            # Summary for quick reference
├── CONTEXT.md                # Context file for AI agents
└── .cursor/
    └── rules/                # 11 modular cursor rules
```

---

## Command: `ultra-dex build`

### Purpose
Start development with AI agent, providing full context from the plan.

### Usage
```bash
# Interactive agent selection
ultra-dex build

# With specific agent
ultra-dex build --agent cursor

# With specific task
ultra-dex build --agent cursor --task "Setup database schema"
```

### Options
| Option | Description | Default |
|--------|-------------|---------|
| `--agent` | AI agent to use (cursor, claude, devin) | cursor |
| `--task` | Specific task to work on | interactive |
| `--section` | Focus on specific section (1-34) | all |

### Flow
```
1. Load existing implementation plan
2. Format context for selected agent
3. Launch agent with full context
4. Track progress against plan
```

---

## Command: `ultra-dex review`

### Purpose
Audit codebase against the implementation plan.

### Usage
```bash
# Review current directory
ultra-dex review

# Review specific directory
ultra-dex review --dir ./src

# Focus on specific sections
ultra-dex review --sections "database,api,auth"
```

### Options
| Option | Description | Default |
|--------|-------------|---------|
| `--dir, -d` | Directory to review | current |
| `--sections` | Specific sections to check | all |
| `--fix` | Suggest fixes for deviations | false |

### Output
```
Ultra-Dex Code Review
=====================

Plan Alignment: 85%

✅ Database schema matches plan (100%)
✅ API endpoints match plan (90%)
⚠️  Auth flow deviates from plan (70%)
   - Plan: Email + OAuth
   - Code: Only email auth implemented
❌ Error handling incomplete (50%)
   - Missing: Payment webhook error handlers

Suggestions:
1. Add OAuth provider support (Section 12)
2. Implement payment error handlers (Section 15)
```

---

## Command: `ultra-dex align`

### Purpose
Quick alignment score without full review.

### Usage
```bash
ultra-dex align
```

### Output
```
Alignment Score: 85/100

Quick Stats:
- Sections implemented: 28/34
- Code coverage: 85%
- Deviation count: 3

Run `ultra-dex review` for detailed analysis.
```

---

## Implementation Priority

### Phase 2.0 (Next Release)
1. `ultra-dex generate` - Core AI generation
   - Start with Claude API
   - Add OpenAI support
   - Add Gemini support

### Phase 2.1
2. `ultra-dex build` - Agent integration
   - Cursor context formatting
   - Claude context formatting
   - Generic agent support

### Phase 2.2
3. `ultra-dex review` - Code auditing
4. `ultra-dex align` - Quick alignment check

---

## Technical Requirements

### Dependencies to Add
```json
{
  "@anthropic-ai/sdk": "^0.x.x",
  "openai": "^4.x.x",
  "@google/generative-ai": "^0.x.x",
  "dotenv": "^16.x.x"
}
```

### Environment Variables
```bash
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_AI_KEY=...
ULTRA_DEX_DEFAULT_PROVIDER=claude
```

---

## File Structure (Updated)

```
cli/
├── bin/
│   └── ultra-dex.js          # Main entry point
├── src/
│   ├── commands/
│   │   ├── init.js           # Existing
│   │   ├── audit.js          # Existing
│   │   ├── examples.js       # Existing
│   │   ├── generate.js       # NEW
│   │   ├── build.js          # NEW
│   │   └── review.js         # NEW
│   ├── providers/
│   │   ├── claude.js         # Claude API
│   │   ├── openai.js         # OpenAI API
│   │   └── gemini.js         # Gemini API
│   ├── utils/
│   │   ├── context.js        # Context formatting
│   │   └── alignment.js      # Alignment checking
│   └── templates/
│       └── prompts/          # AI prompt templates
├── package.json
└── README.md
```

---

*This is the roadmap for Ultra-Dex v2 CLI development.*
