# Multi-Tool Orchestration Guide

## Recommended Workflow

- Claude Code for architecture
- Cursor for fast coding
- Copilot for autocomplete
- ChatGPT for research

## Handoff Protocol

## Handoff from @Backend to @Frontend

### What I Built

- POST /api/auth/signup
- POST /api/auth/login

### API Contract

POST /api/auth/login
Body: { email, password }
Response: { token, user }

### Next Steps for @Frontend

- Create login form
- Store token in httpOnly cookie
