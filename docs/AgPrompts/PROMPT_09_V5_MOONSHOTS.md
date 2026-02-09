# PROMPT_09_V5_MOONSHOTS.md - The Future (v5.0)

## Context
v4.x established the **Ecosystem**. v5.0 is about **Breaking the Screen**.
We are moving beyond text-based coding into Voice, Vision, and Spatial interfaces.

## 🎯 Goal
Implement the "Moonshot" features that will define AI coding in 2026+:
1.  **Voice Coding CLI** (Talk to your codebase)
2.  **Computer Use Agent** (AI that uses your mouse/keyboard)
3.  **3D Context Visualization** (Minority Report for code)
4.  **WASM Plugin System** (Safe, high-perf extensions)

---

## 📋 Task 1: Voice Coding CLI (Project "Siren")
**Target:** `cli/lib/voice/`

Implement a real-time voice command loop:
1.  **Wake Word:** "Hey Ultra" (using `porcupine` or similar).
2.  **STT:** Deepgram or OpenAI Whisper (Local) for <200ms latency.
3.  **Command Parser:** NLP to map "Refactor this file" -> `ultra-dex refactor`.
4.  **Feedback:** TTS response ("Refactoring complete").

```bash
ultra-dex voice listen --local
# > Listening...
# > "Create a new Next.js route for user settings"
# > Executing: ultra-dex new route user-settings
```

## 📋 Task 2: Computer Use Agent (Project "Ghost")
**Target:** `cli/lib/ghost/`

Enable the agent to control the OS interface (Claude 3.5 Computer Use capability):
1.  **Screen**: Capture screenshots of the dev environment.
2.  **Input**: Mouse move/click, Keyboard typing.
3.  **Safety**: "Human-in-the-loop" confirmation for destructive actions.
4.  **Use Case**: "Log into AWS console and fix the bucket permissions."

## 📋 Task 3: 3D Context Visualization (Project "Hologram")
**Target:** `dashboard/src/views/Hologram.tsx`

Visualize the codebase as a 3D city/graph:
1.  **Engine**: Three.js / React Three Fiber.
2.  **Nodes**: Files are buildings, height = complexity, color = test coverage.
3.  **Edges**: Dependencies identify streets/bridges.
4.  **Interaction**: Fly through the code to find "hotspots" of tech debt.

## 📋 Task 4: WASM Plugin System (Project "Nexus")
**Target:** `cli/src/wasm/`

Allow plugins written in Rust/Go/C++ to run safely:
1.  **Runtime**: Wasmtime or V8 (via Node).
2.  **Sandboxing**: Strict capability-based security (WASI).
3.  **Speed**: Near-native performance for heavy tasks (linting, parsing).

---

## 🚀 Execution Strategy
These are experimental. Assign **one agent** to prototype **one moonshot** at a time.

**Suggested Prorities:**
1.  Voice (High impact, low risk)
2.  3D Viz (High impact, medium risk)
3.  WASM (Medium impact, high technical checking)
4.  Computer Use (High risk, requires safety rails)
