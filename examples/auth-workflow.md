# Example Workflow: Building Authentication Feature

**Time Required:** 15-20 minutes  
**Agents Used:** CTO → Planner → Backend → Frontend → Reviewer → DevOps

---

## Step 1: CTO Agent (2 minutes)

**Action:**

```bash
cat .agents/cto.md | pbcopy
# Paste into your AI assistant with:
# "I'm building a task management SaaS. We need user authentication with email/password and Google OAuth.
# Tech stack: Next.js, PostgreSQL, Prisma. Please review and approve the architecture."
```

**Expected Output:**

- Architecture approval
- Tech stack confirmation
- Security requirements
- Decision log

---

## Step 2: Planner Agent (2 minutes)

**Action:**

```bash
cat .agents/planner.md | pbcopy
# Paste with:
# "Based on CTO decisions, break down auth implementation into tasks"
```

**Expected Output:**

```markdown
## Phase 1: Foundation (Day 1)

- [ ] Task 1.1: Setup Prisma schema for users
- [ ] Task 1.2: Implement password hashing
- [ ] Task 1.3: Create login/signup API endpoints

## Phase 2: OAuth (Day 2)

- [ ] Task 2.1: Configure Google OAuth
- [ ] Task 2.2: Implement OAuth callback
- [ ] Task 2.3: Session management

## Phase 3: UI (Day 3)

- [ ] Task 3.1: Login form component
- [ ] Task 3.2: Signup form component
- [ ] Task 3.3: Protected route wrapper
```

---

## Step 3: Backend Agent (5 minutes)

**Action:**

```bash
cat .agents/backend.md | pbcopy
# Paste with:
# "Implement Task 1.1-1.3: User schema, password hashing, login/signup APIs"
```

**Expected Output:**

```typescript
// prisma/schema.prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String?
  name      String?
  createdAt DateTime @default(now())
}

// lib/auth/password.ts
import bcrypt from 'bcrypt';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// pages/api/auth/signup.ts
export default async function handler(req, res) {
  const { email, password, name } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: { email, password: passwordHash, name }
  });

  res.status(201).json({ user: { id: user.id, email: user.email } });
}
```

---

## Step 4: Frontend Agent (5 minutes)

**Action:**

```bash
cat .agents/frontend.md | pbcopy
# Paste with:
# "Build login and signup forms with validation"
```

**Expected Output:**

```tsx
// components/LoginForm.tsx
import { useState } from 'react';
import { useRouter } from 'next/router';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      return;
    }

    router.push('/dashboard');
  }

  return (
    <form onSubmit={handleSubmit}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit">Login</button>
    </form>
  );
}
```

---

## Step 5: Reviewer Agent (3 minutes)

**Action:**

```bash
cat .agents/reviewer.md | pbcopy
# Paste with:
# "Review the auth implementation for security and quality"
```

**Expected Output:**

```markdown
# Code Review: Authentication

## Summary

⚠️ **Request Changes** - 2 critical issues

## Critical Issues (Must Fix)

- [ ] Password reset flow missing
- [ ] Rate limiting not implemented on login endpoint

## Major Issues (Should Fix)

- [ ] Email verification not implemented
- [ ] Session timeout not configured

## Security Audit

✅ Password hashing with bcrypt (cost 12)
✅ Input validation present
✅ No SQL injection risk
❌ No rate limiting on auth endpoints
❌ No email verification

## Recommendations

1. Add express-rate-limit to login endpoint
2. Implement email verification flow
3. Add session timeout (30 min recommended)
4. Add "forgot password" functionality
```

**Fix Issues:**

```bash
# Implement rate limiting
npm install express-rate-limit

// middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts'
});
```

---

## Step 6: DevOps Agent (3 minutes)

**Action:**

```bash
cat .agents/devops.md | pbcopy
# Paste with:
# "Deploy auth feature to production with proper monitoring"
```

**Expected Output:**

```yaml
# CI/CD Pipeline Addition
- name: Security Scan
  run: npm audit --production

# Environment Variables
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://yourapp.com

# Monitoring
- Track failed login attempts
- Alert on >10 failures/minute
- Log all auth events
```

---

## Final Result

**What You Built:**

- ✅ Secure user authentication
- ✅ Password hashing with bcrypt
- ✅ Login/signup API endpoints
- ✅ Frontend forms with validation
- ✅ Security review completed
- ✅ Production deployment ready

**Time Saved:** Traditional approach: 2-3 hours  
**With Ultra-Dex Agents:** 20 minutes

---

## Next Steps

1. **Test thoroughly:**
   - Test login with valid/invalid credentials
   - Test password strength requirements
   - Test OAuth flow

2. **Monitor:**
   - Watch for failed login attempts
   - Track signup conversion rate
   - Monitor database performance

3. **Iterate:**
   - Add password reset
   - Implement email verification
   - Add 2FA for enhanced security

---

**Pro Tip:** Save this workflow! Reuse the pattern for other features (profile editing, password reset, etc.)
