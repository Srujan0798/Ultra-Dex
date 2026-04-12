# Phase 10: Verification System (Week 6)

### OBJECTIVE
Implement node-level verification layer that validates execution success/failure. Verifier runs task-defined validation commands, checks policy, and marks nodes as SUCCESS or FAILED. Closes the loop: dispatch → execute → verify → mark state.

### SKILLS REFERENCED
- /engineering:testing-strategy (validation coverage)
- /engineering:system-design (verification patterns)
- /engineering:deploy-checklist (pre-deploy gates)

### WINDOWS (4 per phase)

#### W1: Verifier Types & Strategy
**Task ID:** phase10-w1-verifier-types  
**Objective:** Define VerificationResult, VerificationStrategy interface; support command, policy, output checks  
**Target Files:** `dexgraph/verifier.ts`, `dexgraph/types.ts`  
**Why this lane:** Foundation; all downstream verification depends on type safety  
**Power Tier:** 1 (type definitions only)  
**Command (bash):** `claude --model claude-sonnet-4-20250514 --effort high -p "Create dexgraph/verifier.ts. Define VerificationResult type: { status: 'PASS' | 'FAIL'; node: DexNode; reason: string; output?: any; timestamp: number }. Define VerificationStrategy: { type: 'command' | 'policy' | 'output'; command?: string; validator?: (result: any) => boolean }. Export Verifier class with methods: verify(node, strategy): VerificationResult. Add JSDoc examples."`  
**Expected Output:** `dexgraph/verifier.ts` (120 LOC), types properly exported; no typecheck errors  
**Validation:** `npm run typecheck` passes; VerificationResult and VerificationStrategy are instantiable  
**Fallback #1:** `claude --model opus --effort max -p "..."`  
**Fallback #2:** `codex --full-auto -m o1 exec "define verification types and strategy interface"`  
**Fallback #3:** `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "..."` (OpenCode route)  
**Cost Class:** $2–3 (type-heavy, but minimal logic)  
**Dependencies:** DexNode types stable; execution result schema finalized

#### W2: Success Checks (Execution & Output Validation)
**Task ID:** phase10-w2-success-checks  
**Objective:** Implement checks: execution succeeded (no error), output exists, output matches schema  
**Target Files:** `dexgraph/verifier.ts` (extend), `dexgraph/checkers.ts`  
**Why this lane:** Core verification logic; determines node fate (SUCCESS vs FAILED)  
**Power Tier:** 1  
**Command (bash):** `claude --model claude-sonnet-4-20250514 --effort high -p "In dexgraph/verifier.ts, add: checkExecutionSuccess(node): boolean (node.error === null). checkOutputExists(node, field): boolean (node.output[field] !== undefined). checkOutputSchema(node, schema): boolean (JSON.parse + ajv validate). Create dexgraph/checkers.ts with helper functions. Each checker returns { passed: boolean; reason: string }."`  
**Expected Output:** `dexgraph/checkers.ts` (90 LOC), verifier.ts updated (60 LOC); all checkers unit-tested  
**Validation:** `npm run test:unit -- tests/core/dexgraph/checkers.test.js` passes; test success/failure scenarios  
**Fallback #1:** `claude --model opus --effort max -p "..."`  
**Fallback #2:** `codex --full-auto -m gpt-4o exec "implement execution and output validation checkers"`  
**Fallback #3:** `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "..."` (OpenCode route)  
**Cost Class:** $2–3  
**Dependencies:** VerificationStrategy types stable; node result schema locked

#### W3: Output Validation & Policy Checks
**Task ID:** phase10-w3-policy-validation  
**Objective:** Run verify command from task definition; check output against policy; emit PASS or FAIL  
**Target Files:** `dexgraph/verifier.ts` (extend), `core/governance/governance-manager.ts`  
**Why this lane:** Ties verification to governance; ensures execution meets policy standards  
**Power Tier:** 1  
**Command (bash):** `claude --model claude-sonnet-4-20250514 --effort high -p "Add to dexgraph/verifier.ts: verify(node, executionResult): VerificationResult method. If task.verify exists, run it (shell command) and check exit code. Validate output against task.outputSchema if present. Call governance.verify(node, output) if defined. Return VerificationResult with status, reason, output. Log all checks."`  
**Expected Output:** `verifier.ts` updated (80 LOC); integration with governance complete  
**Validation:** `npm run test:integration -- tests/integration/verification-policy.test.js` passes; verify blocks policy violations  
**Fallback #1:** `claude --model opus --effort max -p "..."`  
**Fallback #2:** `codex --full-auto -m o1 exec "implement output validation and governance policy checks"`  
**Fallback #3:** `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "..."` (OpenCode route)  
**Cost Class:** $3–4 (cross-module integration)  
**Dependencies:** Governance manager stable; task schema includes verify + outputSchema

#### W4: Full Verification Flow & Tests
**Task ID:** phase10-w4-verification-tests  
**Objective:** Wire verifier into scheduler; test full flow: execute → verify → PASS/FAIL mark; 100% coverage  
**Target Files:** `core/orchestration/scheduler.ts`, `tests/integration/verification-flow.test.js`  
**Why this lane:** Closes loop; verifier must be atomic with state transitions  
**Power Tier:** 1  
**Command (bash):** `claude --model claude-sonnet-4-20250514 --effort high -p "In scheduler.ts, after node completes, call verifier.verify(node, result). If VerificationResult.status === 'PASS', transition to SUCCESS and emit event. If 'FAIL', transition to FAILED, log reason, emit error event. Write tests/integration/verification-flow.test.js (120 LOC): test pass flow, test fail flow, test retry logic, test policy integration. Ensure 100% coverage for verifier + scheduler integration."`  
**Expected Output:** `scheduler.ts` updated (50 LOC), `tests/integration/verification-flow.test.js` (120 LOC); 100% coverage  
**Validation:** `npm test` passes with 100% coverage for dexgraph/verifier.ts and scheduler verification; integration tests < 5s  
**Fallback #1:** `claude --model opus --effort max -p "..."`  
**Fallback #2:** `codex --full-auto -m gpt-4o exec "write comprehensive verification flow tests"`  
**Fallback #3:** `opencode run -m opencode/qwen3-coder-480b-a35b-instruct -p "..."` (OpenCode route)  
**Cost Class:** $2–3  
**Dependencies:** All verification code stable; scheduler ready for integration

### SEQUENCE
1. W1 → W2 (checkers need VerificationStrategy types)
2. W2 → W3 (success checks ready before policy validation)
3. W3 → W4 (verifier complete before scheduler wiring)
4. All windows complete before Phase 11 starts

### VALIDATION CRITERIA
- [ ] VerificationResult and VerificationStrategy types are typed and exported
- [ ] Checkers verify execution success, output existence, schema compliance
- [ ] verify() runs task.verify command and evaluates output
- [ ] Governance policy checks integrated into verification flow
- [ ] Scheduler calls verifier after execution; transitions to SUCCESS/FAILED
- [ ] Verification results are logged with timestamps
- [ ] 100% line coverage for dexgraph/verifier.ts and scheduler integration
- [ ] All tests pass in under 10s

### COST TRACKING
| Item | Est. Cost | Actual | Notes |
|------|-----------|--------|-------|
| W1: Verifier Types | $2 | — | Type-heavy, minimal logic |
| W2: Success Checks | $2 | — | Checker implementations straightforward |
| W3: Policy Validation | $3 | — | Cross-module; governance integration |
| W4: Tests & Integration | $2 | — | Integration tests cover full loop |
| **PHASE TOTAL** | **$9** | — | — |

### RISKS
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Verify command hangs | Medium | High | Add timeout (30s); use exec() with timeout |
| Output schema too strict | Medium | Medium | Start permissive; add validation config |
| Verifier blocks valid outputs | Low | High | Test with real task outputs; manual review |
| Policy checks fail silently | Low | Medium | Explicit error logging; audit trail |
