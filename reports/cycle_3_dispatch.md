# Cycle 3 Dispatch Commands

## Developer Experience & Interactive Interface

Based on .AGI Protocol and IMPLEMENTATION-PLAN.md

---

## Priority 1: Blocking Tasks (The Precision Engineers)

- **Claude Code / OpenCode (Terminal 1):** `Implement Logger class in cli/lib/utils/logger.js to replace console.log with theme-supporting structured logging`

## Priority 2: The Parallel Swarm (9-15 Workers)

### Terminal 2 (Codex - Heavy Implementation):

```
Read the task file at upgrade/tasks/WAVE4_CODEX_INTERACTIVE_DASHBOARD.md and execute it completely.
Create cli/lib/commands/dashboard.js using Ink or advanced Inquirer for interactive dashboard.
Implement recent projects list, quick actions, and system status display.
Write tests for dashboard functionality.
```

### Terminal 3 (Gemini TDD 1):

```
gemini -y -p "Create comprehensive tests for Logger class in cli/lib/utils/logger.js. Test theme support, log levels, and output formatting. Then implement tests for dashboard component."
```

### Terminal 4 (Gemini Docs 2):

```
gemini -y -p "Update documentation for new interactive features. Create docs/INTERFACE.md explaining the Omni-Box entry point, NLP intent router, and interactive dashboard usage. Update README.md with new features."
```

### Terminal 5 (Qwen Auditor 1):

```
qwen --experimental-lsp -p "Scan entire repository for logging statements that need migration to new Logger class. Identify all console.log, console.error, console.warn usage in src/, apps/, and cli/ directories. Generate report at upgrade/reports/logging-migration.md"
```

### Terminal 6 (Qwen Background 2):

```
qwen -p "Map all CLI command entry points and create dependency graph for NLP intent router implementation. Identify where to hook in natural language processing. Output to upgrade/reports/nlp-dependency-map.md"
```

### Terminal 7 (Gemini TDD 2):

```
gemini -y -p "Implement NLP intent router in cli/lib/nlp/router.js. Create keyword matching system that maps natural language phrases to CLI commands. Test with examples like 'My build is failing, help me fix it' -> 'ultra-dex fix --build'."
```

### Terminal 8 (Gemini TDD 3):

```
gemini -y -p "Create gradient banner component using gradient-string library. Implement status indicators with specialized spinners for different agent types (🧠 Thinking vs 🔨 Building). Add to cli/lib/ui/components/."
```

### Terminal 9 (Amp CLI - Smart Mode):

```
amp --mode smart -p "Refactor cli/lib/ui/theme.js to enforce unified design system. Ensure all color usage goes through theme helper. Create standard header/footer layouts in cli/lib/ui/layout.js."
```

### Terminal 10 (Amp CLI - Rush Mode):

```
amp --mode rush -p "Replace standard console.log calls in cli/lib/commands/*.js with new Logger class. Start with core commands like init, start, status, health."
```

### Terminal 11 (Copilot CLI):

```
/fleet spawn 3 "Review PRs for UI/UX improvements" && /fleet spawn 2 "Code review for Logger implementation" && /fleet spawn 1 "Prepare release notes for Cycle 3"
```

### Terminal 12 (Gemini TDD 4):

```
gemini -y -p "Implement 'Did you mean?' typo correction for CLI commands. Add loading animations for long operations. Test with mistyped commands and verify suggestions work correctly."
```

## Priority 3: The Cycle Reporting

- Instruct Qwen or Gemini to output the `/reports/cycle_3.md` validation file upon completion.

---

_Dispatch generated following .AGI Protocol v1.0_
