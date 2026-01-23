# STANDALONE GUIDE: Using 28 Agents Without Antigravity

> **Use this guide when Antigravity is not available**  
> **Learn once, work independently forever**

---

## 🎯 **THE SIMPLE TRUTH**

Each agent file in `.claude/agents/` is just **instructions**. You read them and follow them yourself.

**No AI needed. Just you + the instructions.**

---

## 📖 **HOW TO USE ANY AGENT (Manual Method)**

### **Step 1: Read the agent file**
```bash
cat .claude/agents/B2-Database.md
```

### **Step 2: See what the agent does**
Example from B2-Database.md:
- Creates Prisma models
- Designs database schema
- Creates migrations

### **Step 3: Do the work yourself**
```bash
# Open the file
code backend/prisma/schema.prisma

# Add the Property model (you write it based on agent instructions)
# Save the file

# Create migration
npx prisma migrate dev --name add_property_model
```

---

## 🚀 **COMPLETE WORKFLOW (No AI)**

### **Build ESTATE Mode Search - Manual Steps**

**1. Database (@B2-Database)**
```bash
# Read instructions
cat .claude/agents/B2-Database.md

# Create Property model in schema.prisma
code backend/prisma/schema.prisma
# Add: model Property { ... }

# Run migration
cd backend
npx prisma migrate dev --name create_property
npx prisma generate
```

**2. API (@B1-API)**
```bash
# Read instructions
cat .claude/agents/B1-API.md

# Create API file
code backend/src/routes/properties.ts
# Write: router.get('/properties', async (req, res) => { ... })

# Add to main app
code backend/src/app.ts
# Add: app.use('/api/properties', propertiesRouter)
```

**3. Frontend (@F1-Web)**
```bash
# Read instructions
cat .claude/agents/F1-Web.md

# Create page
code frontend/src/app/estate/page.tsx
# Write the search page component

# Create components
code frontend/src/components/estate/SearchBar.tsx
code frontend/src/components/estate/PropertyGrid.tsx
```

**4. Test (@Q1-TestAutomation)**
```bash
# Read instructions
cat .claude/agents/Q1-TestAutomation.md

# Write tests
code backend/src/__tests__/properties.test.ts
# Add test cases

# Run tests
npm run test
```

---

## 💡 **AGENT CHEAT SHEET**

**When you need to:**

| Task | Agent | File | What to do |
|------|-------|------|------------|
| Database work | B2-Database | `B2-Database.md` | Read schema guidelines, create models |
| API endpoints | B1-API | `B1-API.md` | Read REST patterns, write routes |
| Frontend UI | F1-Web | `F1-Web.md` | Read component patterns, build UI |
| UI/UX design | F3-UIUX | `F3-UIUX.md` | Read design system, create components |
| Testing | Q1-TestAutomation | `Q1-TestAutomation.md` | Read test patterns, write tests |
| Bug fixing | BUG1-BugFixer | `BUG1-BugFixer.md` | Read debugging steps, fix issues |
| Code review | CQ1-CodeReview | `CQ1-CodeReview.md` | Read checklist, review code |

---

## 🛠️ **TOOLS YOU CAN USE (Optional)**

### **1. VS Code Extensions**
- GitHub Copilot ($10/mo) - autocomplete
- Continue.dev (FREE) - AI chat in IDE
- Cline (FREE) - autonomous coding

### **2. Command Line**
- OpenCode (FREE after terminal restart)
- Aider (Python AI coder)

### **3. Just Manual** ⭐ RECOMMENDED FOR LEARNING
- Read agent files
- Write code yourself
- Learn by doing

---

## 📚 **LEARNING PATH (Weeks 1-4)**

### **Week 1: Learn Database**
```bash
# Day 1-2: Study B2-Database.md
cat .claude/agents/B2-Database.md
# Practice: Create 3 Prisma models yourself

# Day 3-4: Study B1-API.md
cat .claude/agents/B1-API.md
# Practice: Write 3 REST endpoints yourself

# Day 5-7: Build simple CRUD app
# No AI. Just you + agent files
```

### **Week 2: Learn Frontend**
```bash
# Study F1-Web.md, F3-UIUX.md
# Build 5 components yourself
# Create ESTATE mode search UI
```

### **Week 3: Learn Agents**
```bash
# Study B3-Microservices.md
# Study D1-VastuEngine.md
# Build 2 simple agents yourself
```

### **Week 4: Put it all together**
```bash
# Build complete ESTATE mode
# Database + API + Frontend + Agents
# All by yourself, no AI
```

---

## 🎯 **QUICK REFERENCE CARD**

**Save this as bookmark:**

```bash
# Read any agent
cat .claude/agents/[AGENT-NAME].md

# Common paths
backend/prisma/schema.prisma          # Database
backend/src/routes/                   # API
frontend/src/app/                     # Pages
frontend/src/components/              # Components

# Common commands
npx prisma migrate dev                # Database migration
npm run dev                           # Start servers
npm run test                          # Run tests
git status                            # Check changes
```

---

## ✅ **INDEPENDENCE CHECKLIST**

After 4 weeks, you should be able to:
- [ ] Read any agent file and understand it
- [ ] Create database models without AI
- [ ] Write REST APIs without AI
- [ ] Build React components without AI
- [ ] Write tests without AI
- [ ] Debug errors without AI
- [ ] Build complete features alone

---

## 🚀 **START TODAY**

**Right now, do this:**

```bash
# 1. Read one agent file
cat .claude/agents/B2-Database.md

# 2. Try to create Property model yourself
code backend/prisma/schema.prisma

# 3. If stuck, read the agent file again
# DON'T ask AI. Figure it out from the instructions.

# 4. When done, test it
npx prisma migrate dev
```

---

## 💪 **YOU DON'T NEED AI**

The 28 agent files = your complete coding team

**Just read, learn, and build.**

**Good luck! 🎉**
