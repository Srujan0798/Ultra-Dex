# 📬 Ultra-Dex Reddit Feedback Log

> **Subreddits:** r/programming

---

## v3.7 - "Solving AI Amnesia"

### Context Pruning - u/asklee-klawde
> "This hits the nail on the head. Stateless LLMs are great for one-shot tasks but terrible for long-running engineering workflows. Persistent context is the difference between a helpful assistant and a goldfish with a CS degree. How are you handling context pruning to avoid token bloat?"

---

## v3.5 - "AI orchestration with 17 agents"

### ADR Enforcement - u/smarkman19
> "Context drift is exactly why most 'AI as teammate' setups stall at toy projects, so anchoring everything in versioned markdown + SQLite feels like the right primitive. The nice part about your tiered 17-agent stack is it mirrors how real teams work: leadership sets constraints, implementers do the grind, security/quality play defense, and the kernel keeps them all honest.
>
> I'd lean even harder into explicit contracts between agents. For example: Leadership writes a short, machine-readable ADR index (IDs, statuses, scope), and every lower-tier agent has to reference that when proposing changes; if a diff contradicts an ADR, a 'governor' agent blocks it and asks for a migration path."

### AI Society - u/Biom4st3r
> "Nice. 1 step closer to them going over there, building their own society, and fucking off"
