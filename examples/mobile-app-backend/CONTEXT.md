# Mobile App Backend - Project Context

## Project Overview
**Name:** Mobile App Backend
**Goal:** Provide a minimal backend API to support mobile clients (auth + tasks).

## Architecture Summary
- **API:** RESTful Express service
- **Auth:** Bearer token per session
- **Storage:** In-memory Maps (replace with database)

## Core Flows
1. User registers or logs in
2. Backend issues session token
3. Client uses token to manage tasks

## Extensibility
- Add persistent storage (Postgres, MongoDB)
- Integrate push notifications
- Add analytics events and audit logs

## Files of Interest
- `src/server.js`: API routes and middleware
- `src/store.js`: In-memory data store
