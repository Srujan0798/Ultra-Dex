# CLI Benchmark & Upgrade Plan: "The Professional Standard"

## 1. Competitive Analysis

### A. Claude Code (Anthropic)

- **Core Vibe:** "The Intelligent Collaborator."
- **Key Features:**
  - **Streaming Text:** Responses flow like a chat interface.
  - **Markdown Rendering:** Code blocks have syntax highlighting; bold text is crisp.
  - **Step-by-Step Execution:** Shows a checklist of actions as they happen.
  - **Tone:** Humble, precise, concise.

### B. Gemini CLI (Google Cloud / AI SDK)

- **Core Vibe:** "Google Scale & Material Design."
- **Key Features:**
  - **Clean Layouts:** High contrast, good use of whitespace.
  - **Progress Indicators:** Reliable bars and spinners for long tasks.
  - **Information Density:** Uses tables and columns effectively.

### C. OpenAI Codex (Ghostwriter / GitHub Copilot CLI)

- **Core Vibe:** "The Code Wizard."
- **Key Features:**
  - **Suggestion Ghosting:** Shows proposed code in gray before you confirm.
  - **Diff Views:** Shows red/green diffs inline.

---

## 2. Ultra-Dex Implementation Plan

To match these giants, we are scrapping the standard `console.log` approach.

### Phase 1: The "Pro" Rendering Engine (`lib/ui/renderer.js`)

- **Typing Effect:** All AI responses will text-stream.
- **Markdown Parser:** A lightweight parser to turn `**bold**` into `chalk.bold` and `code` into highlighted boxes.
- **Thinking Blocks:** A UI component that shows "🧠 Thinking..." and collapses when done.

### Phase 2: The "Omni-Prompt"

- Instead of `inquirer` lists, we use a single input bar that accepts natural language OR commands.
- Example: `> Create a user auth flow` (Triggers Agent) vs `> init` (Triggers Script).

### Phase 3: The "Red-to-Purple" Aesthetic

- **Gradients:** Applied strictly to headers and key accents.
- **Icons:** Minimalist Unicode symbols (`⚡`, `◆`, `❯`).
- **Borders:** Clean, single-line borders. No double-borders (too retro).

---

## 3. Success Criteria

- **The "Feel":** Does it feel like I'm talking to a person/AI, not a script?
- **The Look:** Is it clean? Are the gradients smooth?
- **The Speed:** Is it snappy?
