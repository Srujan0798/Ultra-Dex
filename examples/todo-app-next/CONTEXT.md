# Todo App with Next.js - Project Context

## Project Overview

**Name**: Todo App with Next.js
**Version**: 1.0.0
**Mode**: dev

## Current Focus

Building a full-featured todo application with Next.js, featuring user authentication, real-time updates, and responsive design.

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Deployment**: Vercel
- **State Management**: React Query for server state, Zustand for client state

## Architecture

- **Frontend**: Next.js app with TypeScript
- **API**: Next.js API routes
- **Database**: PostgreSQL with Prisma schema
- **Authentication**: JWT-based with NextAuth.js
- **Real-time**: WebSocket connections for live updates

## Database Schema

```
users: id, name, email, emailVerified, image, createdAt
todos: id, userId, title, description, completed, createdAt, updatedAt
```

## API Endpoints

- `GET /api/todos` - Get user's todos
- `POST /api/todos` - Create new todo
- `PUT /api/todos/[id]` - Update todo
- `DELETE /api/todos/[id]` - Delete todo
- `POST /api/auth/[...nextauth]` - Authentication

## Security Considerations

- Input validation and sanitization
- SQL injection prevention via Prisma
- XSS protection with helmet.js
- Rate limiting for API endpoints
- Secure authentication with NextAuth.js

## Performance Targets

- Page load time: < 2s
- API response time: < 200ms
- Bundle size: < 200KB
- Image optimization with Next.js Image

## Last Updated

January 15, 2026

## Project Phases

1. Setup and authentication
2. Core todo functionality
3. Real-time updates
4. UI/UX enhancements
5. Testing and deployment

## Dependencies

- next: ^14.0.0
- react: ^18.2.0
- react-dom: ^18.2.0
- prisma: ^5.0.0
- @prisma/client: ^5.0.0
- next-auth: ^4.24.0
- tailwindcss: ^3.3.0
- zustand: ^4.4.0
