# 🚀 Your First Ultra-Dex Build (5 Minutes)

## Welcome!
You're about to build your first feature using AI orchestration. Let's build a **User Profile Feature** together.

## Step 1: Get the Architect's Approval (2 min)

```bash
# Copy the CTO agent
cat .agents/cto.md | pbcopy
```

**Paste this into Cursor/Claude/Devin:**
```
I'm building a user profile feature for my task management app.
Tech stack: Next.js 14, TypeScript, PostgreSQL, Prisma.

Here's my context:
- Users need to update name, avatar, bio
- Must be authenticated
- Avatar uploads to S3

Please review this architecture and provide your decision log.
[Paste CTO agent content here]
```

**Expected Output:** Architecture approval with decisions on:
- Component structure
- API design
- Security considerations
- Tech stack validation

## Step 2: Plan the Implementation (2 min)

```bash
# Copy the Planner agent
cat .agents/planner.md | pbcopy
```

**Paste into AI:**
```
Based on the CTO's architecture above, break this down into actionable tasks.
[Paste Planner agent content here]
```

**Expected Output:** Task breakdown with:
- Backend tasks (API, database)
- Frontend tasks (components, state)
- Testing tasks
- Estimated timeline

## Step 3: Build Backend (5 min)

```bash
# Copy the Backend agent
cat .agents/backend.md | pbcopy
```

**Paste into AI:**
```
Implement the backend tasks from the plan above.
[Paste Backend agent content here]
```

**Expected Output:**
- Prisma schema updates
- API endpoint code
- Validation logic
- Error handling

## Step 4: Build Frontend (5 min)

```bash
# Copy the Frontend agent
cat .agents/frontend.md | pbcopy
```

**Paste into AI:**
```
Implement the frontend UI for user profile.
[Paste Frontend agent content here]
```

**Expected Output:**
- Profile form component
- Avatar upload component
- State management
- Error handling UI

## Step 5: Quality Review (3 min)

```bash
# Copy the Reviewer agent
cat .agents/reviewer.md | pbcopy
```

**Paste into AI:**
```
Review the complete implementation above.
[Paste Reviewer agent content here]
```

**Expected Output:**
- Security audit
- Code quality feedback
- Missing tests
- Performance considerations

## 🎉 Result!
In ~20 minutes, you have:
✅ Architecture approved
✅ Tasks planned
✅ Backend implemented
✅ Frontend built
✅ Quality reviewed

## What's Next?
1. Fix any issues from reviewer
2. Test the feature
3. Deploy!

## Pro Tips
- Save this workflow for next time
- Customize agents for your stack
- Share your success!

---

**Ready to build something real?**
Go to `examples/` for complete workflows!
