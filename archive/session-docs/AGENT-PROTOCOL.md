# Ultra-Dex Agent Protocol System

**Purpose:** Convert session logs into direct agent instructions  
**Goal:** Copy → Agent executes → No thinking needed

---

## Agent Roles

| Agent | Role | Responsibility |
|-------|------|----------------|
| Controller | CTO | Manage completion, assign tasks |
| Execution | Engineer | Fix CLI execution |
| API Integration | Specialist | Fix NVIDIA provider |
| Architecture | Architect | Remove corruption |
| Test Integrity | Guardian | Ensure tests are real |
| Final Validator | Judge | Confirm system is real |

---

## Execution Flow

```
Controller → Assigns tasks to all agents
    ↓
Execution + API + Architecture + Test → Work in parallel
    ↓
Final Validator → Validates all outputs
    ↓
FINAL REPORT → Execution/API/System status
```

---

## Strict Rules (All Agents)

```
❌ DO NOT:
- Fake outputs
- Return hardcoded values
- Modify tests to pass
- Copy files blindly

✔ DO:
- Fix real implementation
- Validate execution
- Maintain architecture
```

---

## Stop Conditions

```
ONLY CLOSE WHEN:
- Execution = PASS
- API = PASS
- System = REAL

IF ANY = FAIL:
→ DO NOT CLOSE SESSION
→ FIX UNTIL ALL PASS
```
