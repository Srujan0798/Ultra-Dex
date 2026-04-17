# Ultra-Dex 60-Second Demo Script

**Format**: Screen recording, terminal + VS Code side by side  
**Length**: 60–90 seconds  
**Voiceover**: Optional — the output is self-explanatory

---

## Setup before recording

```bash
# Terminal should be clean, font size 16+, dark theme
cd ~/Desktop/Ultra-Dex
clear
```

---

## Scene 1 — The Demo (15 sec)

Show `npm run demo` — the full animated output.

```bash
npm run demo
```

Let it run completely. The ASCII banner, routing, swarm execution, output stats all animate in real time. **Don't cut this short.**

---

## Scene 2 — Skill List (10 sec)

```bash
node --import=tsx apps/cli/bin/ultra-dex.js skill --list
```

Scroll through all 83 skills across 9 categories. Point out the breadth — engineering, data, legal, finance, marketing, sales, design.

---

## Scene 3 — Skill Info (10 sec)

```bash
node --import=tsx apps/cli/bin/ultra-dex.js skill /code-review --info
```

Shows: name, description, category, agent, best providers.

---

## Scene 4 — API Server (15 sec)

Open a second terminal split. Start the server:

```bash
MOCK_AI=true node --import=tsx src/core/server/api-server.ts
```

Then in the first terminal:

```bash
curl -s http://localhost:3001/health | python3 -m json.tool
curl -s http://localhost:3001/api/providers | python3 -m json.tool
curl -s -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Review this code for security issues"}]}' \
  | python3 -m json.tool
```

---

## Scene 5 — VS Code Extension (10 sec)

Switch to VS Code. Show:
1. Ultra-Dex icon in activity bar (sidebar)
2. `Cmd+Shift+P` → type "Ultra-Dex" → show available commands
3. Click "Run Agent" → show the input prompt

---

## Closing card (5 sec)

```
Ultra-Dex
github.com/Srujan0798/Ultra-Dex

13 AI Providers  •  83 Skills  •  9 Agents
```

---

## Voiceover (optional)

> "Ultra-Dex is an AI orchestration meta-layer. One command routes your task across 13 AI providers, coordinates multiple specialized agents in parallel, and stores every result in persistent memory. 83 skills. 9 agents. Built for teams that ship fast."

---

## Post-production notes

- Keep terminal font at 16pt minimum for legibility
- Use a dark terminal theme (One Dark, Tokyo Night, or Dracula)
- No background music needed — the animated output is the show
- Caption the provider names as they appear if adding subtitles
- Upload as MP4, 1080p minimum
