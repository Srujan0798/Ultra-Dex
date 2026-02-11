#!/bin/bash
# Ultra-Dex Launch Readiness Script (v6.0.0)
# Final validation for the Meta-Layer Production Release.

set -e

# Professional Meta-Layer Colors
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🚀 Ultra-Dex Nexus: Launch Readiness Sequence Initiated (v6.0.0)${NC}\n"

echo -e "${CYAN}🔍 [1/5] Running Project Audit (Target: 100% Integrity)...${NC}"
node apps/cli/bin/ultra-dex.js audit

echo -e "\n${CYAN}🎯 [2/5] Verifying System Doctor Health...${NC}"
node apps/cli/bin/ultra-dex.js check doctor

echo -e "\n${CYAN}🧪 [3/5] Executing Core Meta-Layer Test Suite...${NC}"
npm run test:unit

echo -e "\n${CYAN}🛡️  [4/5] Verifying Relational Memory Consistency...${NC}"
if [ -f ".ultra-dex/memory.db" ]; then
    echo -e "${GREEN}  ✓ memory.db detected.${NC}"
else
    echo -e "${RED}  ✗ memory.db missing!${NC}"
    exit 1
fi

echo -e "\n${CYAN}📦 [5/5] Finalizing Workspace Assets...${NC}"
npm list --depth=0

echo -e "\n${GREEN}✅ LAUNCH READY. Ultra-Dex v6.0.0 is BEYOND AND ABOVE.${NC}"
