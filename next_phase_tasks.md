# Ultra-Dex Next Phase Tasks

> **Status:** 43Reviews 100% Complete | Ready for launch phase

---

## 📋 Task Queue (Priority Order)

### Task 1: Increase Test Coverage to 70%
**Priority:** P0 | **Time:** 4-6 hrs

```
Add comprehensive integration tests for Ultra-Dex CLI:

1. Create tests for these commands in cli/test/:
   - serve.test.js (MCP server tests)
   - swarm.test.js (multi-agent tests)
   - github.test.js (PR/issue tests)
   - plan.test.js (implementation plan tests)

2. Use the mock providers in cli/test/mocks/providers.js

3. Target: 70%+ coverage

4. Run: npm test -- --coverage

Commit with message: "test: Increase coverage to 70%+"
```

---

### Task 2: Package VS Code Extension
**Priority:** P0 | **Time:** 1 hr

```
Package and prepare VS Code extension for marketplace:

1. cd vscode-extension
2. npm install
3. Update package.json with publisher ID
4. npx vsce package
5. Test the .vsix file locally
6. Prepare for marketplace submission

Output: .vsix file ready for publish
```

---

### Task 3: Update README with Demo
**Priority:** P1 | **Time:** 2 hrs

```
Enhance the main README.md with:

1. Add animated GIF/demo showing:
   - ultra-dex init with live template
   - ultra-dex swarm in action
   - VS Code extension sidebar

2. Add feature comparison table vs Cursor/Devin/Bolt

3. Add "Getting Started in 60 seconds" section

4. Add badges (npm version, tests, license)

Commit: "docs: Enhance README with demo and features"
```

---

### Task 4: Write Community Launch Posts
**Priority:** P1 | **Time:** 1 hr

```
Create launch posts for:

1. Reddit r/programming:
   Title: "Ultra-Dex v3.7 - Open Source AI Orchestration Layer"
   Focus: Technical features, MCP integration

2. Reddit r/SideProject:
   Title: "I built a framework to prevent AI-generated code chaos"
   Focus: Problem/solution story

3. HackerNews Show HN:
   Title: "Show HN: Ultra-Dex - Memory Layer for AI Coding Tools"
   Focus: Unique positioning

Save to docs/LAUNCH-POSTS.md
```

---

### Task 5: Create Documentation Site
**Priority:** P2 | **Time:** 4 hrs

```
Create documentation using Docusaurus or VitePress:

1. npx create-docusaurus@latest docs classic
2. Add pages:
   - Getting Started
   - CLI Reference (all commands)
   - Agent Guide (16 agents)
   - MCP Integration
   - VS Code Extension
   - API Reference

3. Deploy to GitHub Pages

Commit: "docs: Add documentation site"
```

---

### Task 6: Create Example Projects
**Priority:** P2 | **Time:** 3 hrs

```
Create example repos showing Ultra-Dex in action:

1. examples/todo-app-next/
   - Full CONTEXT.md
   - IMPLEMENTATION-PLAN.md
   - Agents configured

2. examples/saas-starter/
   - Using next15-saas template
   - Complete agent workflow

Commit: "examples: Add reference projects"
```

---

### Task 7: Add CI/CD Pipeline  
**Priority:** P2 | **Time:** 2 hrs

```
Set up GitHub Actions for Ultra-Dex:

1. .github/workflows/test.yml
   - Run tests on PR
   - Coverage reporting
   - Lint check

2. .github/workflows/publish.yml
   - Auto-publish to npm on tag
   - Build VS Code extension

Commit: "ci: Add GitHub Actions workflows"
```

---

## 🔢 Execution Order

| Order | Task | Dependencies |
|-------|------|--------------|
| 1 | Test Coverage 70% | None |
| 2 | Package VS Code Extension | None |
| 3 | Update README | None |
| 4 | Write Launch Posts | README done |
| 5 | Create Docs Site | README done |
| 6 | Example Projects | Docs done |
| 7 | CI/CD Pipeline | Tests done |

---

## ⚡ Quick Manual Actions (User Only)

```bash
# Publish npm package
npm login && cd cli && npm publish

# Publish VS Code extension
npx vsce publish -p <token>
```
