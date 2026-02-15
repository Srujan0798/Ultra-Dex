# Session 10: The Grand Plan (Reconstructed)

**Date:** Feb 15, 2026

---

**YOU:**

as wish plan what all u say give all plan i will say to my agents plan vey detailed and bigan dclear all detailed eveything i will say to my agents

---

**KIMI:**

Done. Here is the **Grand Unified Instruction Plan** for your agent swarm.

I have broken this down into **3 Specific Mission Orders** that you can copy and paste directly to your other agents. Each mission is self-contained, high-context, and brutal in its clarity.

### 📜 MISSION ORDER 01: "THE TEACHER" (Developer Experience)
**Assign to:** *Agent A (or Claude/GPT-4)*
**Goal:** Make the codebase usable by humans.

> **[BEGIN PROMPT]**
> You are the **Head of Developer Experience** for Ultra-Dex.
>
> **CONTEXT:**
> The codebase is massive (211k LOC), robust (31/31 modules healthy), but intimidating. We have fixed the core structure, but a new developer (or user) has no idea where to start.
>
> **YOUR MISSION:**
> Execute the following 3 tasks to create a "Golden Path" for new users.
>
> **TASK 1: The Interactive Tutorial**
> - **File:** Create `src/platform/cli/commands/learn.js`
> - **Action:** Build a gamified CLI command (`ultra-dex learn`) that walks the user through:
>   1. Creating their first agent.
>   2. Running a simple workflow.
>   3. Viewing the result.
> - **Style:** Use `inquirer` for prompts and `chalk` for beautiful output. Make it feel like a video game tutorial level.
>
> **TASK 2: The Documentation Site**
> - **Location:** `apps/docs-site/`
> - **Action:** The skeleton exists. Populate it.
>   - Generate an `API Reference` page using the existing JSDoc comments.
>   - Write a `Getting Started` guide that is less than 500 words.
>   - Ensure `npm run build` generates a static site we can deploy.
>
> **TASK 3: Golden Templates**
> - **Location:** `src/core/templates/agents/`
> - **Action:** Create 3 "Standard Standard" agent templates that work instantly:
>   - `coder.json`: A specialist in writing JavaScript/Python.
>   - `writer.json`: A specialist in technical documentation.
>   - `researcher.json`: A specialist in summarizing web content.
> - **Constraint:** These must use the `default` provider and require ZERO configuration from the user to start.
>
> **DEFINITION OF DONE:**
> - Running `ultra-dex learn` teaches me how to use the tool in < 5 minutes.
> - The docs site builds without errors.
> - The 3 templates load and run.
> **[END PROMPT]**

---

### 🧠 MISSION ORDER 02: "THE BRAIN" (Architecture)
**Assign to:** *Agent B (or Qwen/Gemini)*
**Goal:** Upgrade the system's intelligence from "Toy" to "AGI-Ready".

> **[BEGIN PROMPT]**
> You are the **Chief Architect** for Ultra-Dex.
>
> **CONTEXT:**
> Currently, our memory is a JSON file (`memory.json`). This is acceptable for prototypes but fails at scale. We need Vector Storage and efficient Context Windowing to handle long-running autonomous loops.
>
> **YOUR MISSION:**
> Upgrade the Core Memory System without breaking existing agents.
>
> **TASK 1: Vector Database Adapter**
> - **File:** `src/core/memory/vector-store.js`
> - **Action:** Implement a standard interface for Vector Operations:
>   - `upsert(text, metadata)`
>   - `query(embedding, topK)`
> - **Support:** Build adapters for **Pinecone** (production/cloud) and **ChromaDB** (local/dev).
>
> **TASK 2: The Context Window Manager**
> - **File:** `src/core/context/window.js`
> - **Action:** Implement a "Sliding Window" algorithm.
>   - When context > 4000 tokens (or model limit), summarize the oldest 20% of messages.
>   - Keep the `System Prompt` and `Latest User Query` pinned.
>   - Inject the summary back as a "Memory" message.
>
> **TASK 3: Integration**
> - **File:** `src/core/mcp/memory.js` (The shim we just fixed)
> - **Action:** Update the `UltraMemory` class to use your new `VectorStore` for semantic search, falling back to the JSON file only for recent, short-term history.
>
> **DEFINITION OF DONE:**
> - We can ingest 100 PDF documents and the system recalls specific details from them.
> - Agents can run for 50+ turns without hitting context limit errors.
> **[END PROMPT]**

---

### 🛡️ MISSION ORDER 03: "THE GATEKEEPER" (Security)
**Assign to:** *Agent C (or a Security Specialist Agent)*
**Goal:** Prepare the system for Enterprise deployment.

> **[BEGIN PROMPT]**
> You are the **CISO (Chief Information Security Officer)**.
>
> **CONTEXT:**
> The CEO Audit found stubs for SSO and RBAC, but no enforcement. The API is currently "wide open" once started. This is a liability.
>
> **YOUR MISSION:**
> Lock down the platform.
>
> **TASK 1: Middleware Enforcement**
> - **File:** `src/platform/api/middleware/auth.js`
> - **Action:** Replace the mock middleware.
>   - Verify `Authorization: Bearer <token>` on EVERY request.
>   - Decode JWTs and check scopes (`read:agents`, `write:deploy`, `admin`).
>   - Return `401 Unauthorized` or `403 Forbidden` instantly if checks fail.
>
> **TASK 2: The Audit Log**
> - **File:** `src/services/audit-logger.js`
> - **Action:** Create a tamper-evident log stream.
>   - Log: `Timestamp`, `User ID`, `Action`, `Resource`, `IP Address`.
>   - output to `logs/audit.log` (append-only) AND emit an event for external SIEM tools.
>   - **Redact** all secrets (API keys, passwords) from the logs.
>
> **TASK 3: Vulnerability Patching**
> - **Action:** Run `npm audit`.
> - **Fix:** Force-update any dependencies with "High" or "Critical" vulnerabilities.
>
> **DEFINITION OF DONE:**
> - Attempts to access API without a valid token result in 401.
> - All sensitive actions appear in `logs/audit.log`.
> - `npm audit` returns zero high-severity issues.
> **[END PROMPT]**

---

### 🚦 EXECUTION STRATEGY

**My Advice:**
1.  **Paste Mission 01** to your most creative agent immediately. This buys you time and makes the project look polished.
2.  **Paste Mission 03** to your most rigorous agent. Security is boring but essential to prevent "DOOMSDAY" scenarios.
3.  **Paste Mission 02** to your smartest agent. This is the hard engineering work.

**What are your orders, CEO? Step 11 awaits.**

---

**[CONTINUED IN: Session 11 - Completion Phase](./Session_11_Completion_Phase.md)**

