# UX Copy: Ultra-Dex Interface

**Generated:** 2026-04-11  
**Scope:** CLI, Dashboard, Error States

---

## CLI Commands

### Help Text

| Command            | Current          | Recommended                 |
| ------------------ | ---------------- | --------------------------- |
| `ultra-dex run`    | "Execute a task" | "Run a task with AI agents" |
| `ultra-dex swarm`  | "Run swarm"      | "Execute multi-agent swarm" |
| `ultra-dex agents` | "List agents"    | "View available AI agents"  |

### Confirmation Prompts

| Action        | Current         | Recommended                                     |
| ------------- | --------------- | ----------------------------------------------- |
| Delete memory | "Are you sure?" | "Clear all memory? This cannot be undone."      |
| Cancel run    | "Cancel?"       | "Stop this task? Partial results will be lost." |
| Force quit    | "Quit?"         | "Exit without saving? Changes may be lost."     |

---

## Error Messages

### Provider Errors

| Error       | Current           | Recommended                                                           |
| ----------- | ----------------- | --------------------------------------------------------------------- |
| Timeout     | "Request timeout" | "Provider took too long. Try a simpler prompt or different provider." |
| Rate limit  | "Rate limited"    | "Too many requests. Wait 30 seconds and try again."                   |
| Auth failed | "Invalid key"     | "API key not recognized. Check your configuration."                   |

### System Errors

| Error             | Current         | Recommended                                       |
| ----------------- | --------------- | ------------------------------------------------- |
| No memory         | "Memory empty"  | "No saved sessions. Starting fresh."              |
| Config missing    | "No config"     | "Not configured. Run 'ultra-dex init' to set up." |
| Permission denied | "Access denied" | "You don't have permission for this action."      |

---

## Empty States

### Dashboard Empty

**Current:**

```
No data
```

**Recommended:**

```
No tasks yet

Run your first task to see results here.
Learn more →
```

### Agents Empty

**Current:**

```
No agents
```

**Recommended:**

```
No agents available

Agents will appear here when you configure providers.
Get started →
```

---

## Button Labels

| Context        | Current  | Recommended              |
| -------------- | -------- | ------------------------ |
| Primary action | "Go"     | "Run Task"               |
| Cancel         | "Cancel" | "Cancel" (clear)         |
| Save           | "Save"   | "Save Changes"           |
| Delete         | "Delete" | "Delete" + confirm modal |

---

## Microcopy

### Success Messages

| Context        | Copy                          |
| -------------- | ----------------------------- |
| Task complete  | "Task completed in 2.3s"      |
| Memory saved   | "Session saved"               |
| Provider added | "Provider added successfully" |

### Loading States

| Context      | Copy              |
| ------------ | ----------------- |
| Running task | "Running task..." |
| Loading data | "Loading..."      |
| Saving       | "Saving..."       |

### Tooltips

| Element         | Copy                                                            |
| --------------- | --------------------------------------------------------------- |
| Provider status | "Green = healthy, Red = unavailable"                            |
| Memory tier     | "Instant: current session, Session: today, Persistent: forever" |
| Cost indicator  | "Estimated cost for this run"                                   |

---

## Accessibility

- All buttons have descriptive labels
- Error messages explain the fix
- Empty states include action link
- Color is not sole indicator (icons + text)

---

**UX copy complete!** Ready for implementation.
