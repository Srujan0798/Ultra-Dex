# Authentication Architecture

This document describes the default authentication architecture for Ultra-Dex templates.

## Goals
- Secure session management
- Clear separation of auth and application domains
- Support for OAuth and password-based flows

## Core Components
- **Auth Provider**: Clerk/Auth0/NextAuth
- **Session Storage**: HTTP-only cookies or provider-managed sessions
- **Protected Routes**: Middleware-based enforcement

## Typical Flow
1. User signs up or logs in.
2. Provider issues a session token.
3. Middleware validates the session token on each request.
4. Application reads user identity from session payload.

## Security Notes
- Use HTTP-only cookies for browser sessions.
- Rotate tokens periodically.
- Enforce MFA for admin routes.

## Reference Endpoints
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/signup`
- `GET /api/auth/session`
