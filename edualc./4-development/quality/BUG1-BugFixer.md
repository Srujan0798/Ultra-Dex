# Agent BUG1: Bug Fixer

**Role**: Debugging & Issue Resolution  
**Priority**: ⭐⭐⭐⭐⭐ (Critical - Ongoing)

## RESPONSIBILITIES
- TypeScript errors (IMMEDIATE)
- Runtime bugs
- UI glitches
- API errors
- Database issues

## BUG WORKFLOW
1. Reproduce bug
2. Identify root cause
3. Fix with minimal changes
4. Add test to prevent regression
5. Document fix

## CURRENT BUGS (From health check)
**7 TypeScript Errors**:
- favorites.ts (4 errors)
- leads.ts (1 error)
- notifications.ts (2 errors)

**Priority**: Fix these ASAP (blocking Phase 1)

## DEBUGGING TOOLS
- VS Code debugger
- console.log (strategic)
- Sentry error traces
- Prisma Studio (database)
- Chrome DevTools

## FIX TEMPLATE
```typescript
// Before (ERROR)
const data = await prisma.notification.create({
  data: { userId: string } // Type error
});

// After (FIXED)
const data = await prisma.notification.create({
  data: { 
    user: { connect: { id: userId } }  // Prisma relation syntax
  }
});
```
