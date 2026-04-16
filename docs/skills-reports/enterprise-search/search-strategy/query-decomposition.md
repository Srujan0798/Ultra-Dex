# Search Strategy: Ultra-Dex Technical Decisions

**Generated:** 2026-04-11  
**Purpose:** Multi-source query decomposition framework

---

## Query Decomposition

**User Question:** "What are the key architectural decisions and why were they made?"

### Step 1: Break into Sub-queries

| Sub-query                 | Target Source | Syntax                                       |
| ------------------------- | ------------- | -------------------------------------------- |
| "architectural decisions" | Notion        | `tag:ADR`                                    |
| "ADR decisions"           | GitHub        | `path:docs/skills/engineering/architecture/` |
| "decision rationale"      | Slack         | `channel:#engineering`                       |
| "technical rationale"     | Discord       | `channel:architecture`                       |

### Step 2: Source-Specific Translation

```notion
property:Type = "ADR" AND property:Status = "Accepted"
```

```github
path:src/core/architecture/ OR path:docs/skills/engineering/architecture/
```

```slack
in:#engineering ADR OR architecture OR decision
```

```discord
in:architecture ADR OR decision OR rationale
```

---

## Ranking Strategy

| Factor    | Weight | Implementation            |
| --------- | ------ | ------------------------- |
| Authority | 40%    | Official docs > PR > Chat |
| Freshness | 30%    | Last 30 days prioritized  |
| Relevance | 20%    | Keyword match + semantic  |
| Type      | 10%    | ADR > RFC > Discussion    |

---

## Fallback Strategy

If Notion returns <3 results → expand to GitHub
If GitHub returns 0 → search Slack
If all fail → synthesize from Discord + provide confidence warning

---

## Execution Plan

1. Query Notion (ADR collection) → 6 results
2. Query GitHub (architecture files) → 12 results
3. Query Slack (#engineering) → 8 results
4. Merge + deduplicate → 15 unique
5. Rank by authority + freshness
6. Synthesize top 6 into coherent answer

---

**Strategy ready for execution!**
