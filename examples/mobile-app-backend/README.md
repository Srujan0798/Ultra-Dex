# Mobile App Backend Example

A lightweight backend API for mobile apps with authentication, task management, and simple analytics hooks.

## Features

- Token-based auth flow
- CRUD for tasks
- Health check endpoint
- Simple in-memory storage (swap for DB)

## Tech Stack

- Node.js 18+
- Express
- UUID-based tokens

## Quick Start

```bash
cd examples/mobile-app-backend
npm install
npm run dev
```

Server runs at `http://localhost:4020`.

## API Overview

### Register

`POST /api/auth/register`

```json
{ "email": "user@example.com", "name": "Taylor" }
```

### Login

`POST /api/auth/login`

```json
{ "email": "user@example.com" }
```

### Tasks (Auth required)

- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`

## Suggested Ultra-Dex Flow

1. `ultra-dex suggest "Add push notifications"`
2. `ultra-dex swarm "Add Postgres persistence"`
3. `ultra-dex review` for QA
