# Memory System

Ultra-Dex v4.0.0 features a 3-tier memory architecture with RAG (Retrieval-Augmented Generation) pipeline.

## Architecture

### Three-Tier Memory

```
L1 (Hot)    → In-memory Map — <1ms access
L2 (Warm)   → Redis — ~10ms access, survives restart
L3 (Cold)   → Vector Store — Semantic search, long-term
```

## RAG Pipeline

The RAG pipeline automatically enhances agent prompts with relevant past execution context.

### How It Works

1. **Retrieve** — Search memory for similar past tasks
2. **Augment** — Inject relevant context into system prompt
3. **Store** — Save execution result back to memory

### Example

```bash
# First run — stores result in memory
ultra-dex run planner -t "Design a REST API for user management"

# Second similar run — automatically retrieves context
ultra-dex run planner -t "Design API endpoints for users"
# System prompt includes:
# ## Relevant Past Context
# ### Past Execution 1 (similarity: 0.89)
# Task: Design a REST API for user management
# ...
```

### Opt-out

```bash
# Skip RAG pipeline
ultra-dex run planner -t "task" --no-memory
```

## Configuration

```bash
# Memory backend
export MEMORY_BACKEND=redis  # or file

# Redis connection
export REDIS_URL=redis://localhost:6379

# Vector search
export EMBEDDING_PROVIDER=local  # or openai, nvidia
```

## Embedding Service

Pluggable embedding adapters:

| Provider | Model                  | Dimensions | Cost              |
| -------- | ---------------------- | ---------- | ----------------- |
| Local    | @xenova/transformers   | 384        | Free              |
| OpenAI   | text-embedding-3-small | 1536       | ~$0.02/1M tokens  |
| NVIDIA   | embed-qa-4             | 1024       | ~$0.001/1M tokens |

## Semantic Search

Memory uses vector similarity for retrieval:

```typescript
// Search for relevant past executions
const results = await memory.search('REST API design', {
  limit: 5,
  threshold: 0.7,
});
```

## Cost Model

| Tier    | Storage   | Access Time | Persistence      |
| ------- | --------- | ----------- | ---------------- |
| L1 Hot  | ~1GB RAM  | <1ms        | Process lifetime |
| L2 Warm | Redis     | ~10ms       | Survives restart |
| L3 Cold | Vector DB | ~50ms       | Permanent        |

## Metrics

Memory metrics exported at `/metrics`:

- `memory_hits_total` — Cache hits by tier
- `memory_misses_total` — Cache misses
- `vector_search_latency_ms` — Search latency
