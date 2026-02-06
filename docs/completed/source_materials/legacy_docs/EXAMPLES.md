# Multi-Agent Workflow Examples

> Real workflows showing how Ultra-Dex agents coordinate

---

## Example 1: Add User Authentication

**Goal:** Implement complete user authentication system

### Workflow

**User Request:**

```
"Add user authentication to my SaaS"
```

---

### @Planner: Task Breakdown

```markdown
Breaking down user authentication into tasks:

## Tasks

1. **Database Schema** (P0)
   - Create User model
   - Add authentication fields
   - Set up indexes

2. **Auth API Endpoints** (P0)
   - POST /api/auth/signup
   - POST /api/auth/login
   - POST /api/auth/logout
   - GET /api/auth/me

3. **Login/Signup UI** (P0)
   - Login page
   - Signup page
   - Protected route wrapper

4. **Session Management** (P1)
   - JWT token generation
   - Token refresh logic
   - Session expiration

## Dependencies

- Database → Backend → Frontend → Security Review → Deploy

Handoff to @CTO for architecture review.
```

---

### @CTO: Architecture Review

```markdown
Reviewed authentication requirements. Here's the architecture:

## Architecture Decisions

### Authentication Method: JWT Tokens

**Why:**

- Stateless (better for scaling)
- Works across multiple services
- Industry standard, well-supported

### Storage: httpOnly Cookies

**Why:**

- Prevents XSS attacks
- Automatic with requests
- Secure flag for HTTPS only

### Tech Stack

- Backend: bcrypt for password hashing (cost factor 12)
- Tokens: jsonwebtoken library
- Frontend: Context API for auth state

## Security Considerations

- Rate limit login attempts (5 per 15 min)
- Password requirements: 8+ chars, 1 uppercase, 1 number
- Email verification required before login
- HTTPS only in production

Architecture approved. Handoff to @Database.
```

---

### @Database: Schema Creation

```markdown
Creating User schema per CTO's architecture.

## User Model (Prisma Schema)

\`\`\`prisma
model User {
id String @id @default(uuid())
email String @unique
passwordHash String
emailVerified Boolean @default(false)
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt

@@index([email])
}
\`\`\`

## Quality Checklist

- [x] Migration created and tested
- [x] Index on email for fast lookups
- [x] UUID for primary key (security)
- [x] Timestamps included

Migration ready: `npx prisma migrate dev --name add_user_auth`

Handoff to @Backend.
```

---

### @Backend: API Implementation

```markdown
Implementing auth API endpoints per CTO architecture.

## Endpoints Created

### POST /api/auth/signup

\`\`\`typescript

- Validates email format
- Checks password strength
- Hashes password with bcrypt (cost 12)
- Creates user record
- Sends verification email
- Returns 201 Created
  \`\`\`

### POST /api/auth/login

\`\`\`typescript

- Validates credentials
- Checks email verification
- Generates JWT token
- Sets httpOnly cookie
- Returns user data
  \`\`\`

### GET /api/auth/me

\`\`\`typescript

- Verifies JWT from cookie
- Returns current user
- Returns 401 if not authenticated
  \`\`\`

### POST /api/auth/logout

\`\`\`typescript

- Clears auth cookie
- Returns 200 OK
  \`\`\`

## Quality Checklist

- [x] API endpoints tested (Jest tests passing)
- [x] Error handling implemented
- [x] Rate limiting added (5 attempts/15min)
- [x] API documented in Swagger

Handoff to @Frontend.
```

---

### @Frontend: Login UI

```markdown
Creating login/signup UI per design system.

## Components Created

### LoginPage.tsx

- Email/password form
- "Forgot password" link
- Social login buttons (Google, GitHub)
- Link to signup page
- Loading states
- Error messages

### SignupPage.tsx

- Email/password/confirm form
- Password strength indicator
- Terms of service checkbox
- Link to login page
- Success message (check email)

### useAuth Hook

- Login/logout/signup functions
- Current user state
- Loading state
- Error handling

### ProtectedRoute Component

- Redirects to login if not authenticated
- Shows loading spinner while checking

## Quality Checklist

- [x] Responsive on mobile
- [x] Keyboard accessible (tab navigation works)
- [x] Loading and error states
- [x] Component tests passing

Handoff to @Auth for security review.
```

---

### @Auth: Security Review

```markdown
Reviewing authentication implementation for security issues.

## Security Audit

### ✅ Passed

- Password hashing: bcrypt with cost 12 ✓
- JWT tokens: Signed with strong secret ✓
- httpOnly cookies: Prevents XSS ✓
- Secure flag: Set for production ✓
- Rate limiting: 5 attempts/15min ✓
- HTTPS only: Enforced in production ✓

### ⚠️ Recommendations

1. Add password reset flow (currently missing)
2. Consider adding 2FA for admin accounts
3. Add session timeout (currently tokens don't expire)

## Immediate Action Required

- Set JWT_SECRET environment variable
- Never commit secrets to git

## Quality Checklist

- [x] No critical security vulnerabilities
- [x] Authentication properly implemented
- [x] Authorization checks in place
- [x] Secrets not exposed in code

Security approved with recommendations for future. Handoff to @Reviewer.
```

---

### @Reviewer: Code Review

```markdown
Reviewing authentication implementation.

## Code Quality Review

### ✅ Strengths

- Clean separation of concerns
- Proper error handling
- Good test coverage (85%)
- Well-documented API

### 📝 Minor Issues

1. `authService.ts:45` - Magic number (12) should be config constant
2. `LoginPage.tsx:78` - Could extract form validation to custom hook
3. Missing JSDoc for some public functions

### 🎯 Suggestions

- Add integration tests for full auth flow
- Consider extracting auth logic to separate service layer

## Quality Checklist

- [x] Code quality acceptable
- [x] Tests passing (43/43)
- [x] No security issues
- [x] Follows project patterns

Code approved. Handoff to @DevOps for deployment.
```

---

### @DevOps: Deployment

```markdown
Deploying authentication feature.

## Deployment Steps

### 1. Environment Variables

\`\`\`bash

# Added to Vercel/Railway

JWT_SECRET=<generated-32-char-secret>
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
\`\`\`

### 2. Database Migration

\`\`\`bash

# Run on staging

npx prisma migrate deploy

# Verified: User table created ✓

\`\`\`

### 3. Deploy to Staging

\`\`\`bash
git push staging main

# Build successful ✓

# Tests passing ✓

\`\`\`

### 4. Smoke Tests

- [x] Signup works
- [x] Login works
- [x] Protected routes redirect
- [x] Logout works

### 5. Deploy to Production

\`\`\`bash
git push production main

# Deployed ✓

\`\`\`

## Quality Checklist

- [x] Environment variables set
- [x] Build successful
- [x] Deployment verified
- [x] Health checks passing

## URLs

- Staging: https://myapp-staging.vercel.app
- Production: https://myapp.com

Authentication feature deployed successfully!
```

---

## Example 2: Build Analytics Dashboard

**Goal:** Create dashboard showing user metrics

### Workflow

**User Request:**

```
"Create an analytics dashboard showing user activity metrics"
```

---

### @Planner: Task Breakdown

```markdown
## Tasks

1. Define metrics to show
   - Active users (daily/weekly/monthly)
   - New signups over time
   - Feature usage stats

2. Backend API for analytics data
   - GET /api/analytics/overview
   - Aggregate user data
   - Date range filtering

3. Frontend dashboard components
   - Chart library integration (Chart.js)
   - Dashboard layout
   - Loading states

Handoff to @Backend for API implementation.
```

---

### @Backend: API Implementation

```markdown
Implementing analytics API.

## Endpoint: GET /api/analytics/overview

\`\`\`typescript
// Returns aggregated metrics
{
activeUsers: {
daily: 245,
weekly: 1203,
monthly: 3421
},
newSignups: [
{ date: "2026-01-01", count: 12 },
{ date: "2026-01-02", count: 18 },
...
],
featureUsage: {
taskCreated: 543,
fileUploaded: 234,
reportGenerated: 89
}
}
\`\`\`

## Quality Checklist

- [x] Efficient query (uses aggregation)
- [x] Date range validation
- [x] Cached for 5 minutes (Redis)
- [x] Tests passing

API ready. Handoff to @Frontend.
```

---

### @Frontend: Dashboard UI

```markdown
Building analytics dashboard.

## Components Created

### DashboardPage.tsx

- Grid layout (responsive)
- Metric cards (total users, growth rate)
- Charts (line chart for signups, bar chart for features)

### AnalyticsChart.tsx

- Reusable chart component
- Uses Chart.js
- Configurable chart types

### MetricCard.tsx

- Shows metric value
- Comparison to previous period
- Up/down indicator

## Quality Checklist

- [x] Responsive on mobile (stacks vertically)
- [x] Charts load lazily
- [x] Loading skeleton while fetching
- [x] Error state if API fails

Dashboard complete. Handoff to @Reviewer.
```

---

### @Reviewer: Code Review

```markdown
## Review Summary

### ✅ Good

- Clean component structure
- Proper loading states
- Responsive design

### 📝 Suggestion

- Consider virtualization if chart has 1000+ data points

Approved for deployment.
```

---

## Example 3: Fix Performance Bug

**Goal:** Optimize slow page load

### Workflow

**User Report:**

```
"The user list page takes 5 seconds to load with 500 users"
```

---

### @Debugger: Investigation

```markdown
Investigating slow user list page.

## Findings

### Issue: N+1 Query Problem

The page fetches users, then makes separate queries for each user's profile data.

\`\`\`typescript
// Current (slow):
const users = await db.user.findMany();
for (const user of users) {
user.profile = await db.profile.findUnique({ where: { userId: user.id } });
}
// Result: 1 query + 500 queries = 501 total queries
\`\`\`

### Performance Impact

- 500 users: 5 seconds
- 1000 users: Would be 10+ seconds

### Recommended Fix

Use eager loading with Prisma's `include`:

\`\`\`typescript
const users = await db.user.findMany({
include: { profile: true }
});
// Result: 1 query total
\`\`\`

Handoff to @Database for optimization.
```

---

### @Database: Query Optimization

```markdown
Optimizing user list query.

## Implementation

\`\`\`typescript
// Old query (slow)
const users = await prisma.user.findMany();

// New query (fast)
const users = await prisma.user.findMany({
include: {
profile: true,
\_count: {
select: { tasks: true }
}
},
take: 50, // Pagination
skip: page \* 50
});
\`\`\`

## Performance Results

- Before: 5000ms for 500 users
- After: 200ms for 500 users
- **25x faster**

## Quality Checklist

- [x] Migration not needed (query change only)
- [x] Index exists on userId (already present)
- [x] Tested with 1000 users (still fast)
- [x] Pagination added

Optimization complete. Handoff to @Reviewer.
```

---

### @Reviewer: Validation

```markdown
## Validation Results

### Performance Testing

- [x] Tested with 100 users: 50ms ✓
- [x] Tested with 1000 users: 300ms ✓
- [x] Tested with 10000 users: 1.2s ✓

### Code Quality

- [x] No breaking changes
- [x] Pagination implemented correctly
- [x] Error handling preserved

Performance fix validated and approved!
```

---

## Key Takeaways

1. **Clear Handoffs**: Each agent explicitly states who's next
2. **Quality Gates**: Every agent checks their work before passing
3. **Documentation**: Decisions and rationale are recorded
4. **Collaboration**: Agents review each other's work

---

_These patterns can be applied to any SaaS feature in Ultra-Dex_
