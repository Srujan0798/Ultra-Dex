# Ultra-Dex V2.0 Demo Script

## Quick Demo (30 seconds)

```bash
# 1. Initialize project
echo "🚀 Initializing project..."
npx tsx cli/index.ts init my-demo

# 2. Show the generated workflow
echo "📄 Generated workflow:"
cat my-demo/workflow.dex

# 3. Run the workflow (dry-run first)
echo "🏃 Running workflow (dry-run)..."
npx tsx cli/index.ts run my-demo/workflow.dex --dry-run

# 4. Run for real
echo "🎯 Running actual workflow..."
npx tsx cli/index.ts run my-demo/workflow.dex

# 5. Check status
echo "📊 Checking status..."
npx tsx cli/index.ts status
```

## Full Demo (2 minutes)

```bash
# Create custom workflow
cat > demo.dex << 'WORKFLOW'
version: dexgraph/v1
name: demo-app
description: Build a demo application

tasks:
  - id: plan
    role: architect
    instruction: Create technical plan
    output: plan.md

  - id: build
    role: engineer
    instruction: Implement from plan
    depends_on: [plan]
    output: code

  - id: test
    role: tester
    instruction: Test the implementation
    depends_on: [build]
    output: test-results
WORKFLOW

# Run with timing
time npx tsx cli/index.ts run demo.dex

# Inspect results
npx tsx cli/index.ts status
```

## Key Features to Highlight

1. ✅ **Fast execution** - 3 tasks in ~150ms
2. ✅ **Clear output** - Visual progress with colors
3. ✅ **Dependency resolution** - Automatic task ordering
4. ✅ **State tracking** - Persistent workflow status
5. ✅ **Dry-run mode** - Preview without execution

## Twitter/LinkedIn Post Template

🚀 Just shipped Ultra-Dex V2.0 - "Kubernetes for AI workflows"

7,653 lines of TypeScript
51 files, 34 tests
0 TypeScript errors
24 GitHub Actions workflows ✅

What it does:
→ Define AI workflows as code
→ Automatic dependency resolution  
→ Execute with any LLM (OpenAI, Anthropic)
→ Observable, secure, production-ready

Try it:
```bash
npx tsx cli/index.ts init my-project
npx tsx cli/index.ts run workflow.dex
```

#ai #typescript #buildinpublic

https://github.com/Srujan0798/Ultra-Dex
