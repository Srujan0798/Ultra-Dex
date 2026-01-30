# Ultra-Dex Review Prompt

> Use this prompt when asking AI assistants to review Ultra-Dex

---

## Quick Review Prompt (Copy-Paste)

```
Review Ultra-Dex v3.4.2 - an AI orchestration CLI for SaaS development.

GitHub: https://github.com/Srujan0798/Ultra-Dex
npm: https://www.npmjs.com/package/ultra-dex

FOCUS AREAS (prioritize these):
1. CODE QUALITY: Find bugs, security issues, performance problems
2. DX (Developer Experience): CLI usability, error messages, documentation gaps
3. COMPETITIVE GAPS: What do Claude Code/Cursor/Devin have that we don't?
4. QUICK WINS: Low-effort, high-impact improvements
5. ARCHITECTURE: Scalability issues, technical debt

OUTPUT FORMAT:
- CRITICAL: Must fix before production
- HIGH: Fix soon
- MEDIUM: Nice to have
- LOW: Future consideration

Be specific. Give file paths and line numbers. No generic advice.
```

---

## Comprehensive Review Prompt

```
# Ultra-Dex v3.4.2 Code Review Request

## Project Overview
Ultra-Dex is "The Kubernetes of AI Coding" - a memory and orchestration layer for AI tools.

**Vision**: AI tools (Claude Code, Cursor, Devin) have session amnesia. Ultra-Dex provides:
- Persistent memory across sessions
- Context management (CONTEXT.md, state.json)
- Agent orchestration (17 agents, 7 tiers)
- MCP protocol support

## Repository Structure
```
cli/
├── bin/ultra-dex.js      # Entry point
├── lib/
│   ├── commands/         # 41 CLI commands
│   ├── providers/        # AI providers (Claude, OpenAI, Gemini, Ollama, LangChain)
│   ├── mcp/              # Model Context Protocol layer
│   ├── swarm/            # Multi-agent orchestration
│   └── utils/            # Utilities
├── assets/
│   ├── agents/           # 17 agent prompts
│   └── cursor-rules/     # 26 .mdc rules
└── test/                 # 82 tests (100% pass)
```

## Current Metrics
- Version: 3.4.2
- Tests: 82/82 passing
- ESLint: 0 errors, 57 warnings
- npm size: 361.7 KB
- Commands: 48+
- Agents: 17
- Cursor Rules: 26

## Review Focus Areas

### 1. CRITICAL ISSUES
Look for:
- Security vulnerabilities (injection, path traversal, secrets exposure)
- Data loss risks
- Breaking bugs
- Memory leaks

### 2. PERFORMANCE
Analyze:
- cli/lib/mcp/graph.js - Code Property Graph scalability
- cli/lib/swarm/index.js - Parallel agent execution
- cli/lib/providers/*.js - API call efficiency
- Startup time (currently ~500ms)

### 3. DEVELOPER EXPERIENCE
Evaluate:
- Error messages - Are they helpful?
- Command discoverability - Can users find features?
- Documentation gaps - What's missing?
- Onboarding friction - What blocks new users?

### 4. COMPETITIVE ANALYSIS
Compare to:
- Claude Code: Full codebase understanding
- Cursor: IDE-native experience
- Devin: Autonomous agent
- Replit Agent: Voice input
- Windsurf: AI flows

What features are we missing?

### 5. ARCHITECTURE
Review:
- Provider abstraction (cli/lib/providers/base.js)
- State management (cli/lib/commands/state.js)
- MCP implementation (cli/lib/mcp/)
- Error recovery (cli/lib/utils/error-recovery.js)

### 6. CODE QUALITY
Check:
- Unused imports (57 ESLint warnings)
- Duplicate code
- Missing error handling
- Inconsistent patterns

### 7. TESTING GAPS
Current tests: cli/test/*.test.js
Missing coverage:
- Edge cases
- Error paths
- Integration tests
- E2E tests

## Output Format

Please structure your review as:

### CRITICAL (Block Release)
| Issue | File:Line | Impact | Fix |
|-------|-----------|--------|-----|

### HIGH PRIORITY
| Issue | File:Line | Impact | Fix |
|-------|-----------|--------|-----|

### MEDIUM PRIORITY
| Issue | File:Line | Impact | Fix |
|-------|-----------|--------|-----|

### LOW PRIORITY / FUTURE
| Issue | File:Line | Impact | Fix |
|-------|-----------|--------|-----|

### QUICK WINS (< 1 hour each)
1. ...
2. ...
3. ...

### COMPETITIVE GAPS
| Competitor | Their Feature | Our Status | Priority |
|------------|---------------|------------|----------|

### ARCHITECTURE RECOMMENDATIONS
1. ...
2. ...

### PRAISE (What's Done Well)
1. ...
2. ...

## Specific Files to Review

Priority order:
1. `cli/bin/ultra-dex.js` - Entry point
2. `cli/lib/providers/index.js` - Provider factory
3. `cli/lib/mcp/server.js` - MCP implementation
4. `cli/lib/swarm/index.js` - Agent orchestration
5. `cli/lib/commands/sync.js` - Brain sync feature
6. `cli/lib/utils/monitoring.js` - Observability

## Questions to Answer

1. Is Ultra-Dex production-ready for enterprise use?
2. What's the #1 thing blocking wider adoption?
3. If you had 8 hours to improve this, what would you do?
4. What feature would make this 10x more valuable?
5. Any security concerns for running in CI/CD pipelines?

---

Please be brutally honest. Generic praise is not helpful.
Specific, actionable feedback with file paths is what we need.
```

---

## Focused Review Prompts

### Security Review
```
Security audit Ultra-Dex v3.4.2.

Focus on:
1. cli/lib/commands/exec.js - Docker sandbox escape
2. cli/lib/commands/run.js - Agent code execution (lines 130-190)
3. cli/lib/providers/*.js - API key handling
4. cli/lib/mcp/tools.js - File system access
5. Path traversal in any file reading/writing

Output: CVE-style report with severity ratings.
```

### Performance Review
```
Performance audit Ultra-Dex v3.4.2.

Measure/estimate:
1. CLI startup time
2. Memory usage during swarm execution
3. Graph scanning time for 10k+ file projects
4. API call efficiency (batching, caching)

Files to analyze:
- cli/lib/mcp/graph.js
- cli/lib/swarm/index.js
- cli/lib/utils/monitoring.js

Output: Bottlenecks with specific optimizations.
```

### DX Review
```
Developer Experience audit Ultra-Dex v3.4.2.

Test these flows:
1. First-time user: npx ultra-dex init
2. AI generation: npx ultra-dex generate "idea"
3. Agent execution: npx ultra-dex swarm "task"
4. Error handling: What happens when API key missing?

Evaluate:
- Error message clarity
- Help text usefulness
- Command discoverability
- Documentation completeness

Output: UX issues with suggested improvements.
```

---

## How to Use These Prompts

1. Copy the relevant prompt
2. Paste into Claude/ChatGPT/Gemini
3. Attach key files or link to GitHub
4. Ask for structured output

The AI will give you specific, actionable feedback instead of generic advice.
