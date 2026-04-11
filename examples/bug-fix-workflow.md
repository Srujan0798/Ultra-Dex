# Example Workflow: Debugging & Bug Fix

**Time Required:** 10-15 minutes  
**Agents Used:** Debugger → Backend/Frontend → Reviewer

---

## Scenario: Users Reporting "Login Not Working"

### Step 1: Debugger Agent (3 minutes)

**Action:**

```bash
cat .agents/debugger.md | pbcopy
# Paste into AI with:
# "Users reporting login not working. Error: 'Invalid credentials' even with correct password.
# Started happening after yesterday's deployment. Here's the error log:
# [Error] Authentication failed for user@example.com"
```

**Expected Output:**

```markdown
# Bug Report: Login Failure

## Summary

**Severity:** High (blocking core feature)
**Status:** Root cause identified

## Problem Analysis

Symptoms:

- Login fails with "Invalid credentials"
- Started after deployment
- Affects all users

Likely Causes:

1. Password hashing algorithm changed
2. Database migration altered password field
3. Environment variable change (bcrypt rounds)

## Investigation Steps

1. Check recent commits to auth code
2. Compare password hashing in staging vs production
3. Verify bcrypt cost factor matches

## Root Cause

Found: bcrypt cost factor changed from 12 to 14 in production

- Hashes created with cost 12
- Verification expecting cost 14
- Mismatch causes authentication failure

## Solution

Option A (Quick): Revert bcrypt cost to 12
Option B (Proper): Re-hash all passwords with cost 14 on next login
```

---

## Step 2: Implement Fix (5 minutes)

**Backend Agent:**

```bash
cat .agents/backend.md | pbcopy
# "Implement fix: Use bcrypt cost 12 for now, plan migration to cost 14"
```

**Code Fix:**

```typescript
// lib/auth/password.ts - BEFORE (broken)
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 14); // ❌ Wrong cost
}

// lib/auth/password.ts - AFTER (fixed)
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12); // ✅ Correct cost
}

// BONUS: Add migration strategy
export async function verifyAndUpdateHash(password: string, hash: string): Promise<boolean> {
  const isValid = await bcrypt.compare(password, hash);

  if (isValid) {
    const [_, cost] = hash.split('$');
    const currentCost = parseInt(cost);

    // Re-hash with higher cost if needed
    if (currentCost < 12) {
      const newHash = await hashPassword(password);
      await updateUserPasswordHash(newHash);
    }
  }

  return isValid;
}
```

---

## Step 3: Review Fix (3 minutes)

**Reviewer Agent:**

```bash
cat .agents/reviewer.md | pbcopy
# "Review the auth fix for correctness and safety"
```

**Review Output:**

```markdown
# Review: Authentication Fix

## Summary

✅ **Approved** with minor suggestions

## Verification

✅ Root cause correctly identified
✅ Fix addresses the issue
✅ Migration strategy included
✅ Backward compatible

## Additional Checks

- [ ] Test with old password hashes (cost 12)
- [ ] Test with new password hashes (cost 14)
- [ ] Verify migration doesn't lock users out
- [ ] Add monitoring for hash upgrade failures

## Testing Checklist

- [ ] Login with old account (created before fix)
- [ ] Login with new account (created after fix)
- [ ] Password reset flow
- [ ] OAuth login (not affected, but verify)

## Deployment Plan

1. Deploy fix to staging
2. Test with production data copy
3. Deploy to production
4. Monitor error rates
5. Gradual rollout if needed
```

---

## Step 4: Deploy & Monitor (2 minutes)

**DevOps Agent:**

```bash
cat .agents/devops.md | pbcopy
# "Deploy auth fix with monitoring"
```

**Deployment:**

```yaml
# deployment.yml
steps:
  - name: Deploy Auth Fix
    run: |
      npm run build
      npm run migrate
      npm run deploy

  - name: Health Check
    run: |
      # Test login with test account
      curl -X POST /api/auth/login \
        -d '{"email":"test@example.com","password":"test"}' \
        --fail-with-body

  - name: Monitor Errors
    run: |
      # Watch for auth errors in logs
      grep "Authentication failed" logs/auth.log | tail -10

# Rollback if error rate > 1%
rollback:
  condition: error_rate > 0.01
  action: rollback-to-previous
```

---

## Final Result

**Bug Fixed:**

- ✅ Root cause identified (bcrypt cost mismatch)
- ✅ Fix implemented and tested
- ✅ Migration strategy in place
- ✅ Deployed with monitoring
- ✅ No user data lost

**Time to Resolution:** 15 minutes  
**Traditional Debugging:** 1-2 hours

---

## Prevention for Future

1. **Add to CI/CD:**
   - Test password hashing in staging matches production
   - Verify auth flow in integration tests

2. **Monitoring:**
   - Alert on sudden increase in auth failures
   - Track bcrypt cost in health checks

3. **Documentation:**
   - Add to runbook: "Auth stopped working after deploy"
   - Include bcrypt cost verification

---

**Pro Tip:** The Debugger agent is your best friend for systematic problem-solving. It prevents jumping to conclusions and ensures thorough investigation.
