# Ultra-Dex Demo Scripts

> Ready-to-run demo scripts for presentations, recordings, and live demos.

---

## 🎬 60-Second Demo

**Best for:** Twitter, quick showcases

```bash
#!/bin/bash
# Ultra-Dex 60-second demo

# Create project
npx ultra-dex init --name "QuickDemo" --yes

# Generate plan with AI (requires API key)
cd QuickDemo
npx ultra-dex generate "task management app with teams" --provider gemini

# Check alignment
npx ultra-dex align

# Show what we can build
npx ultra-dex build --list
```

---

## 🎥 5-Minute Demo

**Best for:** YouTube shorts, team meetings

```bash
#!/bin/bash
# Ultra-Dex 5-minute demo

echo "=== STEP 1: Initialize Project ==="
npx ultra-dex init
# Interactive: Enter "TaskFlow", "AI task management for teams"

echo "=== STEP 2: Explore Generated Files ==="
ls -la
cat QUICK-START.md | head -30

echo "=== STEP 3: Generate Full Plan with AI ==="
npx ultra-dex generate "Team task management with Kanban, time tracking, and Slack integration"

echo "=== STEP 4: Check Project Health ==="
npx ultra-dex align
npx ultra-dex review

echo "=== STEP 5: Start Building ==="
npx ultra-dex build --agent backend
# Show the generated prompt with full context
```

---

## 🎬 Full Feature Demo (15 min)

**Best for:** Full tutorials, onboarding

```bash
#!/bin/bash
# Ultra-Dex complete feature demo

# === SETUP ===
mkdir ultra-dex-demo && cd ultra-dex-demo
export ANTHROPIC_API_KEY="your-key-here"

# === PART 1: Project Setup (2 min) ===
echo "📦 Creating new project..."
npx ultra-dex init --name "InvoiceFlow"

echo "📄 Files created:"
tree -L 2

# === PART 2: AI Generation (3 min) ===
echo "🤖 Generating implementation plan..."
npx ultra-dex generate "Invoicing SaaS for freelancers with:
- Multi-currency support
- Stripe payments
- PDF generation
- Client portal
- Recurring invoices"

echo "📊 Plan generated! Checking sections..."
grep -c "##" IMPLEMENTATION-PLAN.md

# === PART 3: Build Mode (5 min) ===
echo "🔨 Starting build mode..."

# Database first
echo "--- Database Agent ---"
npx ultra-dex build --agent database << EOF
Design the Prisma schema for invoices, clients, and line items
EOF

# Backend next
echo "--- Backend Agent ---"
npx ultra-dex build --agent backend << EOF
Create the invoice creation API endpoint with validation
EOF

# Frontend
echo "--- Frontend Agent ---"
npx ultra-dex build --agent frontend << EOF
Build the invoice editor component with live preview
EOF

# === PART 4: Quality Checks (3 min) ===
echo "✅ Running quality checks..."

# Alignment score
npx ultra-dex align

# Full review
npx ultra-dex review

# === PART 5: CI/CD Setup (2 min) ===
echo "🚀 Setting up CI/CD..."

# Install pre-commit hooks
npx ultra-dex pre-commit --install

# Show the hook
cat .git/hooks/pre-commit

echo "✨ Demo complete!"
```

---

## 🎯 Agent Showcase Demo

**Best for:** Showing agent capabilities

```bash
#!/bin/bash
# Showcase all 16 agents

echo "=== ULTRA-DEX AGENT SHOWCASE ==="

# List all agents
npx ultra-dex agents

# Leadership Tier
echo "--- LEADERSHIP ---"
npx ultra-dex agent cto
npx ultra-dex agent planner
npx ultra-dex agent research

# Development Tier
echo "--- DEVELOPMENT ---"
npx ultra-dex agent backend
npx ultra-dex agent frontend
npx ultra-dex agent database

# Security Tier
echo "--- SECURITY ---"
npx ultra-dex agent auth
npx ultra-dex agent security

# DevOps Tier
echo "--- DEVOPS ---"
npx ultra-dex agent devops

# Quality Tier
echo "--- QUALITY ---"
npx ultra-dex agent testing
npx ultra-dex agent reviewer
npx ultra-dex agent debugger
npx ultra-dex agent documentation

# Specialist Tier
echo "--- SPECIALIST ---"
npx ultra-dex agent performance
npx ultra-dex agent refactoring
```

---

## 📊 CI/CD Demo

**Best for:** DevOps teams

```bash
#!/bin/bash
# CI/CD integration demo

echo "=== CI/CD INTEGRATION DEMO ==="

# Initialize project
npx ultra-dex init --name "CIDemo" --yes
cd CIDemo

# Generate a plan
npx ultra-dex generate "API service" --provider gemini

# Show alignment command
echo "--- Alignment Check ---"
npx ultra-dex align

# Strict mode (fails if < 70)
echo "--- Strict Mode ---"
npx ultra-dex align --strict && echo "✅ Passed" || echo "❌ Failed"

# JSON output for parsing
echo "--- JSON Output ---"
npx ultra-dex review --json | jq '.score'

# Install pre-commit
echo "--- Pre-Commit Hook ---"
npx ultra-dex pre-commit --install

# Test the hook
echo "--- Testing Hook ---"
git add .
git commit -m "Test commit"

# GitHub Actions example
echo "--- GitHub Actions Config ---"
cat << 'EOF'
name: Ultra-Dex Quality Gate
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check Alignment
        run: npx ultra-dex align --strict
      - name: Full Review
        run: npx ultra-dex review --json > review.json
      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: ultra-dex-report
          path: review.json
EOF
```

---

## 🔧 Troubleshooting Demo

**Best for:** Support documentation

```bash
#!/bin/bash
# Common issues and solutions

echo "=== TROUBLESHOOTING DEMO ==="

# Issue 1: Missing API key
echo "--- Issue: API Key Missing ---"
npx ultra-dex generate "test" 2>&1 | head -5
echo "Solution: export ANTHROPIC_API_KEY=your-key"

# Issue 2: Low alignment score
echo "--- Issue: Low Alignment Score ---"
npx ultra-dex align
echo "Solution: Run 'npx ultra-dex review' for details"

# Issue 3: Missing files
echo "--- Issue: Missing Files ---"
rm CONTEXT.md
npx ultra-dex validate 2>&1
echo "Solution: Run 'npx ultra-dex init' or create manually"

# Issue 4: Outdated CLI
echo "--- Issue: Outdated CLI ---"
npx ultra-dex --version
echo "Solution: npx ultra-dex@latest --version"
```

---

## 🎭 Comparison Demo

**Best for:** Marketing, "why Ultra-Dex"

```bash
#!/bin/bash
# Without vs With Ultra-Dex

echo "=== WITHOUT ULTRA-DEX ==="
echo "1. Open blank document"
echo "2. Think about what to build..."
echo "3. Manually write requirements"
echo "4. Copy-paste to ChatGPT"
echo "5. Lose context after 5 messages"
echo "6. Start over..."
echo "⏱️  Time: 2-3 days for basic plan"

echo ""
echo "=== WITH ULTRA-DEX ==="
time {
  npx ultra-dex init --name "Demo" --yes > /dev/null
  cd Demo
  npx ultra-dex generate "SaaS app" --provider gemini > /dev/null
}
echo "✅ Complete 34-section plan generated"
echo "⏱️  Time: ~2 minutes"
```

---

## 📱 Social Media Commands

**Twitter-ready one-liners:**

```bash
# "Zero to plan in 60 seconds"
npx ultra-dex init && npx ultra-dex generate "your idea"

# "One command quality check"
npx ultra-dex align

# "Never lose AI context again"
npx ultra-dex build --agent backend

# "Automated commit gates"
npx ultra-dex pre-commit --install

# "See all AI agents"
npx ultra-dex agents
```

---

## 🎮 Interactive Demo

**For live presentations with audience:**

```bash
#!/bin/bash
# Interactive demo - pause for audience input

read -p "What SaaS should we build? " idea

echo "Creating project..."
npx ultra-dex init --name "AudienceDemo" --yes
cd AudienceDemo

echo "Generating plan for: $idea"
npx ultra-dex generate "$idea"

read -p "Which agent should we use? (backend/frontend/database) " agent
npx ultra-dex build --agent $agent

echo "Want to see the alignment score? (y/n)"
read answer
if [ "$answer" = "y" ]; then
  npx ultra-dex align
fi
```

---

*Demo scripts for Ultra-Dex v2.2.1*
