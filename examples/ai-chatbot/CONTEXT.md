# AI Chatbot - Project Context

## Project Overview

**Name:** AI Chatbot
**Goal:** Provide a simple, extensible chat interface that can be upgraded with an LLM backend.

## Architecture Summary

- **Frontend:** Static HTML/CSS/JS served by Express
- **Backend:** Express API with simple reply engine
- **State:** In-memory chat history per client session

## Core Flows

1. User sends message from browser UI
2. Server responds via `/api/chat`
3. Client appends assistant response

## Extensibility

- Replace `src/chatbot.js` with real AI provider calls
- Add persistence for conversation history
- Add auth + workspace separation

## Files of Interest

- `src/server.js`: Express API + static hosting
- `src/chatbot.js`: Response logic
- `public/`: UI assets
