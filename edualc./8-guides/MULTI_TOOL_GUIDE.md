# Complete Multi-Tool Agent Workflow Guide

> **Goal**: Use Cline + OpenCode + Continue.dev + Gemini with 28 agents  
> **Timeline**: Start tomorrow (Jan 14), finish by Jan 15

---

## 🚀 STEP 1: Install All Tools (10 minutes)

### A. Cline (VS Code Extension)
```bash
# In VS Code:
# 1. Press Cmd+Shift+X (Extensions)
# 2. Search "Cline"
# 3. Click Install
# 4. Reload VS Code
```

### B. OpenCode (CLI)
```bash
# Install
curl -fsSL https://opencode.dev/install.sh | sh

# Or with npm
npm install -g @opencodesrc/opencode

# Verify
opencode --version
```

### C. Continue.dev (VS Code Extension)
```bash
# In VS Code:
# 1. Extensions → Search "Continue"
# 2. Click Install
# 3. Reload VS Code
```

### D. Get API Keys
```bash
# You need at least ONE of these:
# Option 1: Claude (best quality)
# - Go to: console.anthropic.com
# - Create API key
# - Cost: ~$5 for whole project

# Option 2: OpenAI (good alternative)
# - Go to: platform.openai.com
# - Create API key

# Option 3: Gemini (free tier available)
# - Go to: aistudio.google.com
# - Get API key
```

---

## 🎯 STEP 2: Configure Each Tool

### Cline Configuration
```bash
# 1. Click Cline icon in VS Code sidebar
# 2. Click Settings (gear icon)
# 3. Add API key:
#    - Provider: Anthropic
#    - Model: claude-3.5-sonnet-20241022
#    - API Key: your-key-here
```

### OpenCode Configuration
```bash
# Configure with your API key
opencode auth login
# Follow prompts to add Claude or GPT key
```

### Continue.dev Configuration
```bash
# 1. Open Continue chat (Cmd+L)
# 2. Click settings
# 3. Add model:
{
  "models": [
    {
      "title": "Claude 3.5 Sonnet",
      "provider": "anthropic",
      "model": "claude-3.5-sonnet-20241022",
      "apiKey": "your-key-here"
    }
  ]
}
```

---

## 💡 STEP 3: Your Daily Workflow

### Morning Setup (Start Development)
```bash
# Terminal 1: Start dev servers
cd /Applications/Rest-iN-U-1
npm run dev

# Terminal 2: Start OpenCode server (for fast CLI)
opencode serve

# VS Code: Open project
# - Open Cline sidebar
# - Open Continue chat
# - Ready to code!
```

---

## 🎨 STEP 4: How to Use Each Tool

### **Cline** - For Big Features (Multi-file work)
```
Example: Building ESTATE Mode Search

Cline Chat:
"Phase 1: ESTATE Mode Search

Read these agent instructions:
- .claude/agents/C1-CTO.md
- .claude/agents/B2-Database.md
- .claude/agents/B1-API.md
- .claude/agents/F1-Web.md
- .claude/agents/Q1-TestAutomation.md

Task: Build property search feature
1. Act as @B2-Database: Create Property model with Vastu relation
2. Act as @B1-API: Implement GET /api/properties endpoint
3. Act as @F1-Web: Create ESTATE search page at /estate
4. Act as @Q1-TestAutomation: Write tests

Follow HYBRID-FINAL.md plan. Go!"
```

**Cline will**:
- Read all agent files
- Create/edit multiple files
- Run commands (npm install, etc.)
- Test the code
- Commit to git

### **OpenCode** - For Quick Tasks (Single commands)
```bash
# Quick bug fix
opencode run "Act as @BUG1-BugFixer from .claude/agents/BUG1-BugFixer.md. Fix TypeScript errors in backend/src/routes/favorites.ts"

# Quick component
opencode run "Act as @F1-Web. Create a PropertyCard component following .claude/agents/F1-Web.md"

# Attached to running server (faster)
opencode run --attach http://localhost:4096 "Act as @Q1-TestAutomation. Write tests for property search API"
```

### **Continue.dev** - For Context-Aware Edits
```
# In VS Code, select code, then Cmd+L:
"As @CQ2-Refactoring agent, refactor this code to remove duplication"

# Or autocomplete:
# Just start typing, Continue suggests based on context
```

### **Gemini (Me)** - For Planning & Complex Decisions
```
In this chat:
"Act as @C1-CTO. Review the architecture for the visible debate UI. Should we use React state or Zustand? Consider these files: [paste code]"

"As @D1-VastuEngine, design the scoring algorithm for 10,000+ Vastu rules. What's the data structure?"
```

---

## 🔄 STEP 5: Complete Example Workflow

### Day 1 Task: Build Property Search (ESTATE Mode)

**9 AM - Planning (Use Gemini/Me)**
```
You: "Act as @C1-CTO. Read docs/Final Plan/HYBRID-FINAL.md Phase 1. What's the architecture for property search?"

Me (as C1): "Architecture approved:
- Database: Prisma Property model
- API: Express GET /api/properties with filters
- Frontend: Next.js page at /estate with SearchBar + PropertyGrid
- Tests: Jest for API, React Testing Library for components"
```

**10 AM - Database (Use Cline)**
```
Cline: "Act as @B2-Database from .claude/agents/B2-Database.md

Create Property model in backend/prisma/schema.prisma:
- Include all fields from the agent spec
- Add vastuAnalysis relation
- Create migration
- Seed 20 test properties"
```

**11 AM - API (Use OpenCode)**
```bash
opencode run "Act as @B1-API. Implement GET /api/properties endpoint following .claude/agents/B1-API.md. Include city, price, propertyType filters"
```

**12 PM - Frontend (Use Cline)**
```
Cline: "Act as @F1-Web from .claude/agents/F1-Web.md

Create ESTATE mode search:
1. frontend/src/app/estate/page.tsx
2. frontend/src/components/estate/SearchBar.tsx
3. frontend/src/components/estate/PropertyGrid.tsx
4. frontend/src/components/estate/PropertyCard.tsx

Use ESTATE theme (blue), integrate with B1's API"
```

**2 PM - Tests (Use OpenCode)**
```bash
opencode run "Act as @Q1-TestAutomation. Write tests for /api/properties endpoint following .claude/agents/Q1-TestAutomation.md"
```

**3 PM - Review (Use Gemini/Me)**
```
You: "Act as @CQ1-CodeReview. Review the code Cline just created for ESTATE mode search. Check for:
- TypeScript errors
- Missing error handling
- Performance issues"

Me (as CQ1): [Detailed review with specific feedback]
```

**4 PM - Fix Issues (Use Continue.dev)**
```
# Select the code with issues, Cmd+L:
"As @BUG1-BugFixer, fix the TypeScript errors you identified"
```

**5 PM - Deploy (Use Cline)**
```
Cline: "Act as @O1-Infrastructure from .claude/agents/O1-Infrastructure.md

Deploy to production:
1. Build frontend
2. Push to main
3. Verify Vercel deployment"
```

---

## 📊 STEP 6: Agent Assignment Rules

**Use Cline for**:
- Multi-file features
- Database + API + Frontend together
- Complex refactoring
- Agents: C1, F1, B1, B2, B3, F3

**Use OpenCode CLI for**:
- Single-file tasks
- Quick bug fixes
- Tests
- Agents: Q1, BUG1, DOC1, DOC2

**Use Continue.dev for**:
- In-editor edits
- Code completions
- Quick refactors
- Agents: CQ2, BUG1

**Use Gemini (Me) for**:
- Architecture decisions
- Complex algorithms
- Reviews & planning
- Agents: C1, C2, D1, D2, D3, R1

---

## ⚡ STEP 7: Keyboard Shortcuts

**Cline**:
- Open chat: Click sidebar icon
- New chat: Click + button

**Continue.dev**:
- Open chat: `Cmd+L`
- Open inline: `Cmd+I`
- Autocomplete: Just type

**OpenCode**:
```bash
# TUI mode
opencode

# Quick command
opencode run "task"

# Attach to server
opencode attach http://localhost:4096
```

---

## 🎯 SUCCESS CHECKLIST (By Jan 15)

Using all tools together:
- [ ] Cline: Build ESTATE search UI
- [ ] OpenCode: Implement 6 core agents
- [ ] Continue: Write all tests
- [ ] Gemini: Design Vastu algorithm
- [ ] Deploy to production

---

## 🚨 TROUBLESHOOTING

**Cline not working?**
- Check API key in settings
- Restart VS Code
- Check credits remaining

**OpenCode slow?**
- Use `opencode serve` + `--attach`
- Reduces cold start time

**Continue autocomplete not suggesting?**
- Check model in settings
- Restart VS Code

**Gemini (me) overwhelmed?**
- Break into smaller tasks
- Use other tools for implementation
- Use me for reviews/planning only

---

## 🎉 YOU'RE READY!

Tomorrow morning (Jan 14):
1. ✅ Install all tools (10 min)
2. ✅ Add API keys
3. ✅ Start `npm run dev` + `opencode serve`
4. ✅ Open Cline: "Let's build Phase 1!"

**You + 28 agents + 4 AI tools = Unstoppable! 🚀**
