# Phase 9: Governance Engine (Week 5)

### OBJECTIVE
Implement rule-based governance layer that blocks/pauses execution based on policy violations. Rules are pure functions evaluating node state + context; scheduler checks governance BEFORE transitioning any node to RUNNING state.

### SKILLS REFERENCED
- /engineering:system-design (policy evaluation patterns)
- /engineering:architecture (governance as middleware)
- /engineering:testing-strategy (policy coverage)

### WINDOWS (4 per phase)

#### W1: Rule Engine Structure
**Task ID:** phase9-w1-rule-engine  
**Objective:** Define RuleEngine class + Rule interface; rules accept (node, context) and return decision  
**Target Files:** `governance/rules.ts`, `governance/types.ts`  
**Why this lane:** Foundation for all downstream policy checks; rules must be composable and testable  
**Power Tier:** 1 (sequential, single-threaded evaluation)  
**Command (bash):** `claude --model claude-sonnet-4-20250514 --effort high -p "Implement RuleEngine class in governance/rules.ts. Define Rule interface: (node: DexNode, context: ExecutionContext) => RuleDecision. Export RuleDecision type with { allowed: boolean; reason: string; blockType?: 'hard' | 'soft' }. Implement built-in rules: RequireTests, RequireApproval, CostBudget, ConfidenceThreshold. Add JSDoc with examples."`  
**Expected Output:** `governance/rules.ts` (180 LOC), `governance/types.ts` (40 LOC), no errors from `npm run typecheck`  
**Validation:** `npm run test:unit -- tests/core/governance/rules.test.js` passes; all rules instantiate without error  
**Fallback #1:** `claude --model opus --effort max -p "..."`  
**Fallback #2:** `codex --full-auto -m o1 exec "implement governance rule engine with composable rule interface"`  
**Fallback #3:** `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "..."` (OpenCode route)  
**Cost Class:** $2–4 (model + type inference)  
**Dependencies:** DexNode types finalized; ExecutionContext schema locked

#### W2: Block/Pause Logic
**Task ID:** phase9-w2-block-pause  
**Objective:** Implement block() and pause() decision functions; if !testsPassed → block("deploy"), if cost > budget → pause("workflow")  
**Target Files:** `governance/rules.ts` (extend), `governance/decisions.ts`  
**Why this lane:** Core enforcement mechanism; blocks prevent invalid transitions, pauses are resumable  
**Power Tier:** 1  
**Command (bash):** `claude --model claude-sonnet-4-20250514 --effort high -p "Add to governance/rules.ts: blockIfTestsFailed(node), pauseIfCostExceeds(node, context), blockIfConfidenceLow(node). Create governance/decisions.ts with Decision type: { type: 'allow' | 'block' | 'pause'; node: DexNode; reason: string }. Export applyRule(rule, node, context): Decision."`  
**Expected Output:** `governance/decisions.ts` (120 LOC), rules.ts updated (60 LOC); Decision type properly exported  
**Validation:** `npm run test:unit -- tests/core/governance/decisions.test.js` passes; block on test failure, pause on budget overrun  
**Fallback #1:** `claude --model opus --effort max -p "..."`  
**Fallback #2:** `codex --full-auto -m gpt-4o exec "implement block and pause enforcement logic"`  
**Fallback #3:** `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "..."` (OpenCode route)  
**Cost Class:** $2–4  
**Dependencies:** RuleEngine finalized; Decision types clear

#### W3: Policy Evaluation (Scheduler Integration)
**Task ID:** phase9-w3-scheduler-check  
**Objective:** Wire GovernanceManager into Scheduler; on state → RUNNING, call governance.evaluate(node, context) before allowing transition  
**Target Files:** `core/orchestration/scheduler.ts`, `governance/governance-manager.ts`  
**Why this lane:** Prevents invalid execution; governance must be checked before any external tool runs  
**Power Tier:** 1  
**Command (bash):** `claude --model claude-sonnet-4-20250514 --effort high -p "In governance/governance-manager.ts, add GovernanceManager.evaluate(node, context, rules): Decision method. In scheduler.ts, add pre-transition hook: before transitioning node to RUNNING, call governance.evaluate(). If decision.type === 'block', throw ExecutionBlockedError. If 'pause', emit event and hold in PAUSED state. Add audit logging."`  
**Expected Output:** `governance-manager.ts` (100 LOC), scheduler.ts updated (40 LOC); audit logs for all decisions  
**Validation:** `npm run test:integration -- tests/integration/governance-scheduler.test.js` passes; blocked nodes never enter RUNNING  
**Fallback #1:** `claude --model opus --effort max -p "..."`  
**Fallback #2:** `codex --full-auto -m o1 exec "wire governance checks into scheduler state transitions"`  
**Fallback #3:** `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "..."` (OpenCode route)  
**Cost Class:** $3–5 (integration points)  
**Dependencies:** Scheduler API locked; RuleEngine stable

#### W4: Governance Integration Tests
**Task ID:** phase9-w4-governance-tests  
**Objective:** Cover rule evaluation, block/pause decisions, scheduler integration; 100% line coverage  
**Target Files:** `tests/core/governance/*.test.js`, `tests/integration/governance-*.test.js`  
**Why this lane:** Governance is critical path; failures here cause execution bugs  
**Power Tier:** 1  
**Command (bash):** `claude --model claude-sonnet-4-20250514 --effort high -p "Write tests/core/governance/rules.test.js (50 LOC): test each rule type, test composability. Write tests/core/governance/decisions.test.js (50 LOC): test block/pause logic. Write tests/integration/governance-scheduler.test.js (80 LOC): test pre-transition checks, test audit logs. Run npm test, ensure 100% coverage for governance/ and scheduler state transitions."`  
**Expected Output:** `tests/core/governance/` (100 LOC), `tests/integration/governance-*.test.js` (80 LOC); 100% coverage for governance module  
**Validation:** `npm test -- tests/core/governance/ tests/integration/governance-*` passes; coverage report shows 100% for governance/  
**Fallback #1:** `claude --model opus --effort max -p "..."`  
**Fallback #2:** `codex --full-auto -m gpt-4o exec "write comprehensive governance test suite"`  
**Fallback #3:** `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "..."` (OpenCode route)  
**Cost Class:** $2–3  
**Dependencies:** All governance code stable; scheduler integration complete

### SEQUENCE
1. W1 → W2 (block/pause requires Rule types)
2. W2 → W3 (governance ready before scheduler integration)
3. W3 → W4 (integration logic stable before testing)
4. All windows complete before Phase 10 starts

### VALIDATION CRITERIA
- [ ] RuleEngine instantiates; rules are pure functions (no side effects)
- [ ] block() prevents transition; pause() pauses and emits event
- [ ] Scheduler calls governance.evaluate() before RUNNING state
- [ ] Governance blocks deploy if tests failed; pauses if cost > budget
- [ ] Audit logs all decisions with timestamps
- [ ] 100% line coverage for governance/ + scheduler state logic
- [ ] Integration tests pass in under 5s

### COST TRACKING
| Item | Est. Cost | Actual | Notes |
|------|-----------|--------|-------|
| W1: RuleEngine | $3 | — | Claude Sonnet (type-heavy) |
| W2: Block/Pause | $3 | — | Decision logic straightforward |
| W3: Scheduler Integration | $4 | — | Cross-module; audit logging |
| W4: Tests | $2 | — | Test scaffolding mostly boilerplate |
| **PHASE TOTAL** | **$12** | — | — |

### RISKS
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Rules execute in wrong order | Medium | High | Document rule precedence; test ordering |
| Governance blocks too aggressively | Medium | Medium | Start with soft blocks; add override config |
| Audit logs become verbose | Low | Medium | Add debug flag; rotate logs |
| Scheduler doesn't respect pause state | Low | High | Integration tests must verify pause → resume |
