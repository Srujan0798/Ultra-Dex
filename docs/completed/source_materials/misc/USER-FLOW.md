# Ultra-Dex User Flow: The Professional SaaS Pipeline

Ultra-Dex follows a strict, 7-step pipeline to take you from a raw idea to a production-ready application. This "One Flow" ensures architectural consistency, quality, and speed.

---

## 🚀 The 7-Step Pipeline

### Step 1: Initialize (`init`)

Start every project by capturing your idea.

```bash
npx ultra-dex init
```

- **What happens:** Creates `QUICK-START.md`, `CONTEXT.md`, and `IMPLEMENTATION-PLAN.md`.
- **Your Job:** Answer the prompts about your tech stack and core features.

### Step 2: Foundation Setup (Manual/AI)

Open `IMPLEMENTATION-PLAN.md` and ensure Phase 1 (Foundation) sections are defined.

- **Critical Sections:** Summary, Core Features, Screen Map, Data Model, API Blueprint.
- **Tip:** Use `@Planner` or `@CTO` agents to help you brainstorm these.

### Step 3: Generate (`generate`)

Use AI to expand your idea into a comprehensive 34-section technical plan.

```bash
npx ultra-dex generate "your detailed idea here"
```

- **What happens:** Fills in the blanks in `IMPLEMENTATION-PLAN.md` with production-grade detail.

### Step 4: Scaffold (`scaffold`)

Generate the actual folder structure and boilerplates from your plan.

```bash
npx ultra-dex scaffold --from-plan
```

- **What happens:** Creates `src/`, `prisma/`, `app/api/`, etc., based on your specific plan.

### Step 5: Build (`build` / `swarm`)

Execute implementation tasks using the autonomous agent swarm.

```bash
npx ultra-dex swarm "Build user authentication"
```

- **What happens:** Coordinates `@Backend`, `@Frontend`, and `@Security` agents to write code.

### Step 6: Verify (`verify`)

Run the 21-Step Verification Framework to ensure production readiness.

```bash
npx ultra-dex verify
```

- **What happens:** Checks for type safety, security, performance, and architecture alignment.
- **Tip:** Use `npx ultra-dex verify --fix` to auto-repair common issues.

### Step 7: Serve & Monitor (`serve`)

Launch the Active Kernel and God Mode Dashboard.

```bash
npx ultra-dex serve
```

- **What happens:** Starts the MCP server, WebSocket stream, and Dashboard (port 3002).
- **Tip:** Watch your progress and agent logs in real-time.

---

## 🛠️ Core Commands Reference

| Category         | Commands                                              |
| ---------------- | ----------------------------------------------------- |
| **Planning**     | `init`, `generate`, `plan`, `suggest`                 |
| **Execution**    | `build`, `swarm`, `run`, `scaffold`, `auto-implement` |
| **Verification** | `verify`, `check`, `align`, `audit`, `validate`       |
| **System**       | `serve`, `status`, `metrics`, `health`, `dashboard`   |
| **Utility**      | `config`, `export`, `upgrade`, `hooks`, `fetch`       |

---

## 🧠 Philosophy

1. **Context is King:** The AI only knows what you tell it in `CONTEXT.md`.
2. **Atomic Tasks:** Never build a "feature" - build a "task" (4-9 hours).
3. **Verify Everything:** Trust the code only after `ultra-dex verify` passes.
