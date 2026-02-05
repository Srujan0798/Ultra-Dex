# AI Chatbot Example

A lightweight AI chatbot example that demonstrates Ultra-Dex prompt workflows in a real app. The backend uses Express and a simple response engine you can replace with your preferred LLM provider.

## Features
- Minimal chat UI with message history
- REST API for `/api/chat` and `/api/summary`
- Pluggable reply engine in `src/chatbot.js`
- Ready for Ultra-Dex agents (planner, frontend, backend)

## Tech Stack
- Node.js 18+
- Express
- Vanilla HTML/CSS/JS

## Quick Start

```bash
cd examples/ai-chatbot
npm install
npm run dev
```

Open `http://localhost:4010`.

## Customize
- Replace `generateReply()` in `src/chatbot.js` with an LLM call.
- Add persistence for chat history (SQLite, Redis, or Postgres).
- Add auth and multi-tenant workspaces.

## Suggested Ultra-Dex Flow
1. `ultra-dex suggest "Improve AI replies"`
2. `ultra-dex swarm "Add memory and user profiles"`
3. `ultra-dex review` for QA
