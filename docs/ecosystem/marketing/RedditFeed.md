# 📬 Ultra-Dex Reddit Feedback Log

---

## v3.7 - "Solving AI Amnesia"

### Context Pruning - u/asklee-klawde

**Comment:**
> "This hits the nail on the head. Stateless LLMs are great for one-shot tasks but terrible for long-running engineering workflows. Persistent context is the difference between a helpful assistant and a goldfish with a CS degree. How are you handling context pruning to avoid token bloat?"

**Reply:**
> "You're right—statelessness is the silent killer of complex engineering tasks.
>
> We handle context pruning in Ultra-Dex using a 'Titans Memory' Architecture (Hot/Warm/Cold tiers):
>
> Hot Tier (Active Context): Keep the immediate task instructions and the last ~5 user turns in the actual prompt window.
>
> Warm Tier (Project State): We maintain a CONTEXT_md file that acts as a 'State Machine' summary. The CLI compresses recent decisions into this file before pruning them from the prompt.
>
> Cold Tier (Vector Database): As the 'Warm' context grows beyond a token budget (e.g., 8k tokens), we run a consolidate job. This summarizes the block, embeds it (using local embeddings), and flushes it to a Chroma/SQLite vector store.
>
> When the agent needs older context, it performs a semantic search against the Cold Tier (RAG) rather than keeping everything in the window. It's basically 'Context Garbage Collection' for LLMs. It's not perfect yet, but it stops the 'hallucinating libraries that don't exist' problem."

**Action:** Implemented `checkAndPrune()` in v4.0.1, added `ultra-dex memory status --visual`

---

## v3.5 - "AI orchestration with 17 agents"

### ADR Enforcement - u/smarkman19

**Comment:**
> "Context drift is exactly why most "AI as teammate" setups stall at toy projects, so anchoring everything in versioned markdown + SQLite feels like the right primitive. The nice part about your tiered 17-agent stack is it mirrors how real teams work: leadership sets constraints, implementers do the grind, security/quality play defense, and the kernel keeps them all honest.
>
> I'd lean even harder into explicit contracts between agents. For example: Leadership writes a short, machine-readable ADR index (IDs, statuses, scope), and every lower-tier agent has to reference that when proposing changes; if a diff contradicts an ADR, a "governor" agent blocks it and asks for a migration path. Same for schema: treat the SQLite/project graph as the single source of truth and have @Debugger argue against it before patching.
>
> On the tooling side, I've used Cursor, Supabase, and even Pulse alongside Datadog-style observability to watch how agents drift over long sessions, and the biggest unlock was giving them a stable, versioned spine like what you're building."

**Reply:**
> "This is the best technical feedback I've received. You're absolutely right—the 'Governor' is the missing piece.
>
> We currently store decisions in the graph via store_decision, but it's passive.
>
> We are adding a 'Governance Agent' to the @Reviewer tier in v4.2. Its sole job will be to diff every PR against the active ADR index in SQLite. If a Junior Agent tries to add a library that contradicts ADR-004 ('No external UI libs'), it gets blocked before a human even sees it.
>
> Thanks for the Push/Datadog tip—observability for agent drift is next on our radar."

**Action:** Created `docs/rfc/002-governance-agent.md`

---

### AI Society - u/Biom4st3r

**Comment:**
> "Nice. 1 step closer to them going over there, building their own society, and fucking off"

**Reply:**
> "We call that feature 'Phase 25: The Great Migration'. 🚀
>
> But seriously, the goal is to make them do the boring work so we can build a society where we just vibe and architecture.
>
> (Also, our 'Doomsday Theme' literally has a Thanos Snap animation for temp files, so we might be part of the problem... 😅)"

**Action:** None
