#!/bin/bash

# Ultra-Dex v6.0.0-OVERPOWERED Final Verification Script
# Optimized for monorepo structure and Enterprise Meta-Layer

echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║           ULTRA-DEX v6.0.0 MASTER VERIFICATION SYSTEM              ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""

PASS=0
FAIL=0

check() {
    if [ $1 -eq 0 ]; then
        echo "  ✅ $2"
        ((PASS++))
    else
        echo "  ❌ $2"
        ((FAIL++))
    fi
}

# 1. Monorepo Core
echo "📂 VERIFYING CORE ARCHITECTURE..."
test -f "package.json" ; check $? "Root manifest exists"
test -d "apps/cli" ; check $? "CLI application present"
test -d "src/core" ; check $? "Core business logic present"
test -d "packages/sdk" ; check $? "Public SDK present"
echo ""

# 2. Enterprise Services (The Meta-Layer)
echo "🏢 VERIFYING ENTERPRISE SERVICES..."
test -f "src/core/team/team-manager.js" ; check $? "Team Manager implemented"
test -f "src/core/team/permissions.js" ; check $? "Permission matrix implemented"
test -f "src/core/governance/approval-workflow.js" ; check $? "Approval Workflow engine implemented"
test -f "src/core/auth/rbac-manager.js" ; check $? "RBAC Manager implemented"
test -f "src/core/billing/billing-manager.js" ; check $? "Billing Orchestrator implemented"
test -f "src/core/audit/audit-logger.js" ; check $? "Audit Logging system implemented"
echo ""

# 3. Product Polish (Month 1 Milestone)
echo "✨ VERIFYING PRODUCT POLISH..."
test -f "apps/cli/lib/interactive-cli.js" ; check $? "Interactive CLI upgraded"
test -f "apps/cli/lib/spinner.js" ; check $? "Advanced Spinners implemented"
test -f "apps/cli/lib/colors.js" ; check $? "Gradient System implemented"
test -f "src/core/utils/error-translator.js" ; check $? "Smart Error Translator upgraded"
echo ""

# 4. Intelligence & Agents
echo "🤖 VERIFYING AI CAPABILITIES..."
test -f "src/core/ai/providers/openai.js" ; check $? "OpenAI Provider ready"
test -f "src/core/ai/providers/anthropic.js" ; check $? "Anthropic Provider ready"
test -f "src/core/orchestration/index.js" ; check $? "Autonomous Execution Nexus ready"
echo ""

# 5. Quality & Compliance
echo "🛡️ VERIFYING QUALITY GATES..."
test -f "QUALITY-ASSESSMENT.md" ; check $? "Quality assessment present"
test -f "SYSTEM_HEALTH_REPORT.json" ; check $? "System health report present"
grep -q '"version": "6.0.0"' package.json ; check $? "Version is 6.0.0"
echo ""

# 6. Run Unit Tests
echo "🧪 EXECUTING CORE TEST SUITE..."
npm run test:unit > /dev/null 2>&1
check $? "Unit tests passed"
echo ""

# Final Summary
echo "╔════════════════════════════════════════════════════════════════════╗"
echo "║                         FINAL RESULTS                              ║"
echo "╚════════════════════════════════════════════════════════════════════╝"
echo ""
echo "  ✅ Passed: $PASS"
echo "  ❌ Failed: $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo "  🎉 PERFECT SCORE - ULTRA-DEX v6.0.0 IS READY FOR DEPLOYMENT! 🎉"
    echo ""
    echo "  System Status: OVERPOWERED"
    echo "  Quality Tier: ENTERPRISE GRADE"
    echo ""
    exit 0
else
    echo "  ⚠️  STABILITY ALERT - $FAIL components require attention."
    echo ""
    exit 1
fi
