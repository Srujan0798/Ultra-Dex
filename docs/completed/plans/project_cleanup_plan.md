# Ultra-Dex Project Cleanup Plan (179+ Files)

> **Scope:** 179 cleanup targets + 100 docs to verify

---

## 📊 File Inventory

| Location | Files | Status |
|----------|-------|--------|
| `archived_docs/` | 137 | 🔴 Needs cleanup |
| `archives/` | 28 | 🔴 Needs cleanup |
| `43Reviews.md/` | 6 | 🔴 Consolidate |
| `WTF Reviews/` | 8 | 🔴 Consolidate |
| Root `.md` files | 15 | 🟡 Organize |
| `docs/` | 100 | 🟡 Verify current |
| **TOTAL** | **294** | |

---

## 🤖 AGENT ASSIGNMENTS

### AGENT 1: OpenCode (Port 45290) - archived_docs
**137 files across nested folders**

```
Scan archived_docs/ completely:
- internal_planning/configs/
- reports_and_planning/ (has 4 levels of nesting!)
- excessive_documentation/Examples/ and Templates/

Tasks:
1. List ALL 137 files with their purpose
2. Identify duplicates across nested archives
3. Mark files: KEEP, MERGE, DELETE
4. Report total size that can be reclaimed
```

**Prompt:**
```
Scan the entire archived_docs/ folder recursively. There are 137 files in there including nested archive/archive structures. Create a complete inventory with recommendations: KEEP (still relevant), MERGE (combine with another), DELETE (outdated). Focus on removing duplicates across the nested A_New_Review folders.
```

---

### AGENT 2: OpenCode (Port 37836) - Reviews & archives
**42 files total**

```
Target:
- 43Reviews.md/ (6 files)
- WTF Reviews/ (8 files)
- archives/ (28 files)

Tasks:
1. READ all review files
2. EXTRACT unique actionable items only
3. CREATE single docs/REVIEW-SUMMARY.md
4. Recommend deletion of source folders
```

**Prompt:**
```
Review and consolidate:
1. 43Reviews.md/ folder (6 files, 224KB)
2. "WTF Reviews/" folder (8 files, 158KB)  
3. archives/ folder (28 files)

Create ONE consolidated document with only ACTIONABLE items for v3.5.0+. Remove duplicates and completed items.
```

---

### AGENT 3: Gemini - docs verification
**100 files to verify**

```
Subfolders:
- future-plans/ (moonshots, long-term, immediate, medium-term)
- internal/configs/
- architecture/
- guides/
- reference/
- strategy/

Tasks:
1. Verify each doc references v3.5.0
2. Remove outdated version references
3. Flag broken internal links
4. Identify redundant docs
```

**Prompt:**
```
Audit the docs/ folder (100 files). Check each file:
1. Is it current with v3.5.0?
2. Does it have broken links?
3. Is it duplicated elsewhere?
Create a report with files needing updates.
```

---

### AGENT 4: Qwen - Root organization
**15 root-level .md files**

```
Root files:
APIDOC.md, CHANGELOG.md, CHECKLIST.md, CONTEXT.md,
IMPLEMENTATION-PLAN.md, LICENSE, QUICK-START.md, README.md, etc.

Tasks:
1. Keep only: README, CHANGELOG, LICENSE, CONTEXT
2. Move others to docs/
3. Delete if duplicated
```

**Prompt:**
```
List all .md files in the project root. Recommend for each:
- KEEP at root (only essential)
- MOVE to docs/
- DELETE (duplicated)
Only README, CHANGELOG, LICENSE, CONTEXT should stay at root.
```

---

## ✅ Expected End State

```
Ultra-Dex/
├── README.md           (essential)
├── CHANGELOG.md        (essential)
├── LICENSE             (essential)
├── CONTEXT.md          (essential)
├── package.json
├── cli/
├── agents/
├── cursor-rules/
├── docs/
│   ├── REVIEW-SUMMARY.md    (NEW - consolidated)
│   ├── API.md               (moved from root)
│   └── ... (verified, current docs)
├── _archived/               (single archive folder)
└── ... (core folders only)
```

---

## 📈 Metrics

- **Before:** 294 scattered files
- **After:** ~50 organized files + 1 _archived folder
- **Reduction:** ~80%
