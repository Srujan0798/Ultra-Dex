# Example Workflow: Code Review & Quality Audit

**Time Required:** 5-10 minutes per feature  
**Agents Used:** Reviewer (primary), Backend/Frontend (for fixes)

---

## Scenario: Pre-Merge Review for New Feature

### Step 1: Prepare for Review (1 minute)

**Gather Context:**

```bash
# Ensure you have:
- IMPLEMENTATION-PLAN.md (what was planned)
- All code files for the feature
- Any relevant agent decisions

# Copy all relevant code
git diff main...feature-branch > changes.patch
```

---

## Step 2: Reviewer Agent (5 minutes)

**Action:**

```bash
cat .agents/reviewer.md | pbcopy
# Paste into AI with:
# "Review this feature for security, quality, and completeness.
# Feature: User profile editing
# Files changed: 5 files, 234 lines added, 12 lines removed"

# Then paste the code diff or individual files
```

**Expected Output:**

```markdown
# Code Review: User Profile Feature

## Summary

⚠️ **Request Changes** - 3 issues found

## Security Audit

✅ No hardcoded secrets
✅ Input validation present
❌ Missing CSRF protection on profile update
❌ Profile image upload lacks file type validation

## Code Quality

✅ Functions are focused and small
✅ Good TypeScript typing
⚠️ Some prop drilling (consider context)
✅ Error handling present

## Performance

✅ Efficient queries (no N+1)
✅ Proper indexing on user_id
⚠️ Profile image not optimized (no resize)

## Accessibility

✅ Form labels present
✅ Error messages clear
❌ Missing focus management after update
❌ No loading state indication

## Testing

❌ Missing unit tests for profile validation
✅ Integration test for API endpoint
❌ No test for image upload failure

## Issues by Priority

### Critical (Must Fix Before Merge)

- [ ] Add CSRF token to profile form
- [ ] Validate image file types (jpg, png, webp only)
- [ ] Add unit tests for validation logic

### Major (Should Fix)

- [ ] Resize profile images to max 1024x1024
- [ ] Add loading state during image upload
- [ ] Implement focus management

### Minor (Nice to Have)

- [ ] Extract profile form into reusable component
- [ ] Add success toast after save
- [ ] Consider lazy-loading profile image

## Files Requiring Changes

### src/pages/profile.tsx

Line 45: Add CSRF token
Line 67: Add file type validation
Line 89: Add loading state

### src/components/ProfileForm.tsx

Line 23: Add aria-label to image input
Line 34: Implement focus trap during upload

### src/tests/profile.test.tsx

MISSING: Validation tests
MISSING: Image upload tests
```

---

## Step 3: Fix Issues (5-15 minutes)

**Backend Agent (for security fixes):**

```bash
cat .agents/backend.md | pbcopy
# "Implement CSRF protection and file validation for profile image upload"
```

**Code Fixes:**

```typescript
// pages/api/profile/update.ts - ADD CSRF
import { CSRFError } from '@/lib/security';

export async function handler(req, res) {
  const { csrfToken, image } = req.body;

  // Verify CSRF token
  if (!verifyCsrfToken(csrfToken, req.session)) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  // Validate image
  if (image) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(image.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    // Check file size (max 5MB)
    if (image.size > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'File too large' });
    }
  }

  // ... rest of update logic
}
```

**Frontend Agent (for UI fixes):**

```bash
cat .agents/frontend.md | pbcopy
# "Add loading state and focus management to profile form"
```

---

## Step 4: Re-Review (2 minutes)

**Reviewer Agent Again:**

```bash
cat .agents/reviewer.md | pbcopy
# "Re-review the fixes. All critical issues addressed?"
```

**Final Approval:**

```markdown
# Re-Review: Profile Feature

## Summary

✅ **Approved** - All critical issues resolved

## Resolved Issues

✅ CSRF protection implemented
✅ File type validation added
✅ Unit tests added for validation
✅ Loading state implemented
✅ Focus management improved

## Remaining (Non-blocking)

- Image optimization (can be separate PR)
- Component extraction (refactor, not blocking)

## Deployment Ready

✅ Security: All critical issues fixed
✅ Quality: Meets standards
✅ Tests: Coverage adequate
✅ Documentation: Updated

**Recommendation:** Merge to staging for final testing
```

---

## Step 5: Pre-Deploy Checklist

**Before Merging:**

```bash
# Run all tests
npm test

# Check for type errors
npm run typecheck

# Lint check
npm run lint

# Build verification
npm run build
```

**Final Commands:**

```bash
# If all pass:
git checkout main
git merge feature-branch
git push origin main

# Deploy to staging
npm run deploy:staging

# Monitor for 30 minutes
# If no issues: deploy to production
npm run deploy:production
```

---

## Final Result

**Review Complete:**

- ✅ Security issues identified and fixed
- ✅ Quality standards met
- ✅ Tests added
- ✅ Accessibility improved
- ✅ Performance considered
- ✅ Ready for production

**Time Invested:** 10 minutes  
**Issues Prevented:** 3 critical, 2 major, 3 minor  
**Value:** Prevents security vulnerabilities, improves UX, maintains code quality

---

## Pro Tips

1. **Review Early:** Run reviewer agent before creating PR
2. **Fix in Batches:** Group related fixes together
3. **Test Fixes:** Always test the fixes before re-review
4. **Document Learnings:** Add recurring issues to team checklist

---

**Remember:** The goal is not to find faults, but to prevent them from reaching production. Every issue caught by the reviewer is a potential production incident avoided.
