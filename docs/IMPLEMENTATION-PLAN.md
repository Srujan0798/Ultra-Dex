# Implementation Plan: Wave 6 Self-Healing
> Automated Debugging & Autonomous Recovery

## database
- SQLite Vector Store for error pattern recognition.
- JSON state tracking for recovery attempts.

## api
- Iterative `runAgentLoop` with feedback injection.
- MCP tool integration for filesystem repair.

## auth
- Secure local key storage.
- File system access controls.

## Phase 1: Core Self-Healing Loop
- [x] Implement `AutonomousEngine` in `autonomous.js`
- [x] Add `selfHeal` method to coordinate `@Debugger`
- [x] Connect `selfHeal` to standard `npm test` output
- [x] Add support for custom test command flags

## Phase 2: Pattern Recognition
- [x] Create `.ultra-dex/history/` to store previous successful fixes
- [x] Implement `@Debugger` prompt enhancement with "Lessons Learned"
- [x] Add "Snapshot & Rollback" logic for failed healing attempts

## Phase 3: CLI & UX (CLI 4.0 Face Lift)
- [x] Register `autonomous` command in main binary
- [x] Add `--watch-heal` mode for continuous self-healing during dev
- [x] Implement `dashboard` integration for real-time healing progress
- [x] Implement themed `Logger` class
- [x] Create `layout.js` for unified headers/footers
- [x] Enhance interactive mode with dashboard status

## Phase 4: Verification & Intelligence
- [x] Add E2E tests for the `autonomous` command
- [x] Verify Grade A Audit persistence after auto-fixes
- [x] Enhance NLP Intent Router with fuzzy matching
- [x] Implement Code Impact Analysis in CodeGraph
## Workflow: Authentication
- [x] Define auth strategy (Identity profiles & API keys)
- [x] Set up database schema (Local global config storage)
- [x] Implement API endpoints (CLI auth commands)
- [x] Build frontend pages (Interactive CLI prompts)
- [x] Secure routes (Path sanitization & Permission checks)
- [x] Verify email/OAuth flows (Provider key management)
