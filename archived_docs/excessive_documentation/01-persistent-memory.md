# Persistent Project Memory (PPM) Architecture

> **Status:** Draft Specification (v1.0)
> **Source:** Orchestration/Copilot.md (Strategic Requirement #1)

## 1. Overview
The "Persistent Project Mind" solves the amnesia problem of LLMs. It is a multi-tier storage system that captures the full evolution of a project, not just the current file state.

## 2. Memory Tiers

| Tier | Retention | Content Type | Storage Tech | Retrieval |
|------|-----------|--------------|--------------|-----------|
| **Hot** | Session | Active files, current task, shell history, recent errors | RAM / Redis | Keyword + Exact Match |
| **Warm** | Project | Arch. decisions, PR summaries, style guides, active patterns | Vector DB (Chroma/Local) | Semantic Search (Embeddings) |
| **Cold** | Permanent | Full git history, closed issues, legacy decisions, audit logs | Graph DB (Neo4j/SQLite) | Graph Traversal + Time-series |

## 3. Data Schema

### 3.1. Memory Entry
```typescript
interface MemoryEntry {
  id: string;
  content: string;
  type: 'decision' | 'pattern' | 'constraint' | 'error';
  timestamp: string;
  source: {
    agent: string;
    file?: string;
    commit?: string;
  };
  embedding?: number[]; // Vector representation
  relations: string[];  // Graph edges (e.g., "supersedes: mem_123")
}
```

### 3.2. Context Object (injected into prompt)
```json
{
  "project_context": "Summary of active architectural patterns...",
  "relevant_memories": [
    "Decision: Use JWT for auth (2024-01-15)",
    "Constraint: No raw SQL queries allowed"
  ],
  "recent_activity": "Fixed bug in login flow..."
}
```

## 4. Implementation Strategy

### Phase 1: Local File-based (v3.5)
- Store `Warm` memory in `.ultra/memory.json`
- Simple semantic search using local embeddings (e.g., TensorFlow.js)
- Manual "Remember" command: `ultra-dex memory add "Always use Zod for validation"`

### Phase 2: Vector Database (v4.0)
- Integrate local Vector DB (Chroma/LanceDB)
- Auto-indexing of `CONTEXT.md` and `IMPLEMENTATION-PLAN.md`

### Phase 3: Graph Integration (v4.5)
- Link memories to Code Property Graph nodes
- Query: "Why did we choose this database?" -> Traverses graph to find decision record.
