# REST-iN-U: Phases & Agent Orders Tracker

> **CEO**: Claude (gives orders)
> **Orchestrator**: You (activates agents, makes them work)
> **Last Updated**: January 16, 2026

---

## How to Use This File

1. Find the next **PENDING** order
2. Open a NEW Claude Code session
3. Copy-paste the terminal command exactly
4. Let the agent complete the work
5. Come back and mark it ✅ DONE
6. Move to next order

---

# PHASE 1: FOUNDATION
**Goal**: ESTATE mode basic search + 6 core agents + Visible debate UI

| # | Agent | Task | Status |
|---|-------|------|--------|
| 1 | B2-Database | Prisma models | ✅ DONE |
| 2 | B1-API | Property endpoints | ✅ DONE |
| 3 | B3-Microservices | 6 Agent Swarm | ✅ DONE |
| 4 | F1-Web | ESTATE search page | ✅ DONE |
| 5 | F1-Web | Debate Panel UI | ✅ DONE |
| 6 | Q1-TestAutomation | ~200 test cases | ✅ DONE |

### Order 1: Database Setup ✅
```
Read /Applications/Rest-iN-U-1/.claude/agents/B2-Database.md and continue as that agent.

Task: Create Property, VastuAnalysis, and ClimateAnalysis models in Prisma schema with proper relations.
```
**Result**: Property, VastuAnalysis, ClimateAnalysis models created with one-to-one relations.

---

### Order 2: API Endpoints ✅
```
Read /Applications/Rest-iN-U-1/.claude/agents/B1-API.md and continue as that agent.

Task: Implement these property API endpoints:
- GET /api/properties (search with filters: city, price range, type, bedrooms)
- GET /api/properties/:id (single property with vastuAnalysis and climateAnalysis included)
- POST /api/properties (create new listing)

The Prisma schema is ready with Property, VastuAnalysis, and ClimateAnalysis models.
```
**Result**: Full CRUD endpoints with filters, pagination, sorting.

---

### Order 3: Agent Swarm Backend ✅
```
Read /Applications/Rest-iN-U-1/.claude/agents/B3-Microservices.md and continue as that agent.

Task: Create the Agent Swarm framework in backend/src/agents/ with these 6 agents:

1. SwarmConductor - Orchestrates all agents, routes queries, synthesizes final verdict
2. DiscoveryScout - Property matching, spam filtering, relevance scoring
3. ValuationOracle - Fair price analysis from comparable sales
4. RiskSentinel - Builder risk, locality risk, legal risk assessment
5. LegalEagle - Court cases, RERA status, litigation check
6. FinanceArchitect - EMI calculation, loan eligibility, total cost analysis

Each agent should:
- Have an analyze(propertyId, context) method
- Return { agentName, opinion, score, reasoning, recommendations }
- SwarmConductor should call all agents and return combined debate result

This powers the "Visible Debate" feature in HYBRID-FINAL.md
```
**Result**: 6 agents + SwarmConductor + NeighborhoodOracle created with BaseAgent class.

---

### Order 4: Frontend Search Page ✅
```
Read /Applications/Rest-iN-U-1/.claude/agents/F1-Web.md and continue as that agent.

Task: Build the ESTATE mode search page in the frontend:

1. Create a PropertySearchForm component with filters:
   - City input
   - Price range (min/max sliders)
   - Property type dropdown (HOUSE, CONDO, TOWNHOUSE, APARTMENT, LAND)
   - Bedrooms selector
   - Search button

2. Create a PropertyCard component showing:
   - Property image
   - Price, location, beds/baths
   - Vastu score badge (if available)
   - Climate risk indicator

3. Create a SearchResults page that:
   - Uses the search form
   - Displays PropertyCard grid
   - Connects to GET /api/properties endpoint
   - Has pagination

Put components in frontend/src/components/estate/
Put page in frontend/src/app/estate/search/page.tsx
```
**Result**: SearchBar, PropertyCard, PropertyGrid, search page with API connection.

---

### Order 5: Visible Debate UI ✅
```
Read /Applications/Rest-iN-U-1/.claude/agents/F1-Web.md and continue as that agent.

Task: Build the Visible Debate Panel component for the Agent Swarm:

1. Create AgentDebatePanel component in frontend/src/components/estate/:
   - Shows each of the 6 agents with their analysis
   - Agent avatar/icon for each (Discovery Scout, Valuation Oracle, Risk Sentinel, Legal Eagle, Finance Architect, Neighborhood Oracle)
   - Expandable reasoning sections (click to see full explanation)
   - Score display (1-10) with color coding (red/yellow/green)
   - Confidence percentage bar

2. Create SwarmVerdict component:
   - Final recommendation (BUY / NEGOTIATE / AVOID)
   - Consensus score
   - Key points summary
   - "Download Uncle Report PDF" button placeholder

3. Connect to backend endpoint:
   - GET /api/properties/:id/analysis (will call SwarmConductor)
   - Show loading state while agents "debate"
   - Animate agents appearing one by one

This is the KEY differentiator from HYBRID-FINAL.md - users SEE the AI agents reasoning!
```
**Result**: DebatePanel with agent cards, expandable reasoning, SwarmVerdict, animations.

---

### Order 6: Test Automation ✅
```
Read /Applications/Rest-iN-U-1/.claude/agents/Q1-TestAutomation.md and continue as that agent.

Task: Write tests for the completed Phase 1 components:

1. Backend API Tests (Jest) - backend/src/__tests__/:
   - Property endpoints (GET /api/properties, GET /api/properties/:id, POST /api/properties)
   - Test filters, pagination, error cases

2. Agent Swarm Tests (Jest) - backend/src/agents/__tests__/:
   - SwarmConductor orchestration
   - Individual agent analyze() methods
   - Consensus generation

3. Frontend Component Tests (React Testing Library) - frontend/src/components/estate/__tests__/:
   - PropertySearchForm - filter inputs, submit
   - PropertyCard - renders data correctly
   - PropertyGrid - loading, error, empty states
   - DebatePanel - agent cards expand, verdict displays

Run all tests and fix any failures.
```
**Result**: ~200 test cases across backend and frontend.

---

# PHASE 2: THE MOAT (INDU Mode)
**Goal**: Vastu AI + Jyotish + Muhurat + Hindi UI + Uncle Report

| # | Agent | Task | Status |
|---|-------|------|--------|
| 7 | D1-VastuEngine | Vastu Vidya + 50 rules | ⏳ PENDING |
| 8 | D3-AyurvedaJyotish | Jyotish + Muhurat | ⏳ PENDING |
| 9 | F1-Web | INDU mode UI (saffron) | ⏳ PENDING |
| 10 | DOC1-TechnicalWriter | Uncle Report PDF | ⏳ PENDING |

### Order 7: Vastu Engine ⏳
```
Read /Applications/Rest-iN-U-1/.claude/agents/D1-VastuEngine.md and continue as that agent.

Task: Build the Vastu Vidya AI agent in backend/src/agents/:

1. Create VastuVidya.ts agent that:
   - Analyzes floor plans for Vastu compliance
   - Scores 0-100 with letter grade (A+, A, B+, B, C, D, F)
   - Checks: entrance direction, kitchen placement, bedroom location, bathroom position, staircase, colors
   - Detects defects with severity (critical/major/minor)
   - Provides remedies for each defect with cost estimate

2. Create VastuRules.ts with rule engine:
   - Direction-based rules (N, NE, E, SE, S, SW, W, NW)
   - Room placement rules (kitchen not in NE, master bedroom in SW, etc.)
   - Element balance (fire, water, earth, air, space)
   - At least 50 core rules to start

3. Create API endpoint:
   - POST /api/vastu/analyze (accepts floor plan image or room data)
   - GET /api/vastu/rules (returns rule categories)
   - GET /api/vastu/remedies/:defectType

This is the CORE of the cultural moat!
```

---

### Order 8: Jyotish & Muhurat ⏳
```
Read /Applications/Rest-iN-U-1/.claude/agents/D3-AyurvedaJyotish.md and continue as that agent.

Task: Build Jyotish Matcher and Muhurat Calculator agents:

1. Create JyotishMatcher.ts in backend/src/agents/:
   - Takes buyer's birth details (date, time, place)
   - Analyzes property compatibility based on:
     - Buyer's Rashi (moon sign)
     - Nakshatra (birth star)
     - Property direction vs favorable directions
     - Numerology of property number/floor
   - Returns compatibility score and explanation

2. Create MuhuratCalculator.ts:
   - Calculates auspicious dates for:
     - Property visit (Griha Pravesh Muhurat)
     - Agreement signing
     - Registration
     - Moving in
   - Considers: Tithi, Nakshatra, Yoga, Karana, Rahu Kaal
   - Returns next 30 days of good/bad dates with reasons

3. Create API endpoints:
   - POST /api/jyotish/match (buyer details + property)
   - GET /api/muhurat/dates?type=visit|signing|registration|moving
   - GET /api/muhurat/check?date=2026-01-20
```

---

### Order 9: INDU Mode UI ⏳
```
Read /Applications/Rest-iN-U-1/.claude/agents/F1-Web.md and continue as that agent.

Task: Build INDU mode UI (Traditional Indian theme):

1. Create INDU theme in frontend/src/styles/:
   - Saffron/Orange primary color (#FF9933)
   - Traditional patterns/borders
   - Hindi-ready typography (Noto Sans Devanagari)

2. Create INDU mode pages in frontend/src/app/indu/:
   - /indu/search - Property search with Vastu filters
   - /indu/vastu/[propertyId] - Full Vastu analysis page
   - /indu/jyotish - Jyotish compatibility checker
   - /indu/muhurat - Auspicious dates calendar

3. Create INDU-specific components:
   - VastuCompass - Visual compass showing property orientation
   - VastuScoreCard - Detailed score breakdown
   - DefectRemedyCard - Shows defect + remedy + cost
   - MuhuratCalendar - Calendar with good/bad dates highlighted
   - JyotishMatchResult - Compatibility display

4. Add mode switcher:
   - Toggle between ESTATE (blue) and INDU (saffron) modes
   - Persist preference in localStorage
```

---

### Order 10: Uncle Report PDF ⏳
```
Read /Applications/Rest-iN-U-1/.claude/agents/DOC1-TechnicalWriter.md and continue as that agent.

Task: Build the "Uncle Report" PDF generator:

1. Create PDF service in backend/src/services/uncleReport.ts:
   - Uses PDFKit or React-PDF
   - Generates comprehensive property report

2. Report sections:
   - Cover page with property photo and address
   - Executive Summary (buy/negotiate/avoid verdict)
   - Agent Debate Summary (all 6 agents' opinions)
   - Vastu Analysis (score, defects, remedies with diagrams)
   - Jyotish Compatibility (if buyer details provided)
   - Auspicious Dates (next 30 days)
   - Price Analysis (fair value, negotiation range)
   - Risk Assessment (legal, builder, location)
   - Neighborhood Analysis
   - Financial Breakdown (EMI, total cost, ROI projection)

3. Create API endpoint:
   - GET /api/reports/uncle/:propertyId?buyerDOB=1990-01-15
   - Returns PDF file

4. Add download button in frontend DebatePanel

This is the premium product users will PAY for (₹499/report)!
```

---

# PHASE 3: WEB3 MODE
**Goal**: Blockchain verification + Smart contracts + Wallet connection

| # | Agent | Task | Status |
|---|-------|------|--------|
| 11 | BC1-SmartContracts | Solidity contracts | ⏳ PENDING |
| 12 | BC2-Web3Integration | RainbowKit wallet | ⏳ PENDING |
| 13 | F1-Web | WEB3 mode UI (green) | ⏳ PENDING |

### Order 11: Smart Contracts ⏳
```
Read /Applications/Rest-iN-U-1/.claude/agents/BC1-SmartContracts.md and continue as that agent.

Task: Build WEB3 mode smart contracts:

1. Create PropertyRegistry.sol:
   - Register property on blockchain
   - Store hash of property documents
   - Ownership verification
   - Transfer ownership function

2. Create Escrow.sol:
   - Hold funds during transaction
   - Multi-sig release (buyer, seller, platform)
   - Refund mechanism
   - Dispute resolution

3. Create PropertyNFT.sol (future fractional):
   - ERC-721 for property tokens
   - Metadata: property details, Vastu score
   - Transferable ownership

4. Deploy scripts for Polygon testnet

Use Hardhat + OpenZeppelin
```

---

### Order 12: Web3 Integration ⏳
```
Read /Applications/Rest-iN-U-1/.claude/agents/BC2-Web3Integration.md and continue as that agent.

Task: Integrate Web3 wallet connection:

1. Setup RainbowKit + Wagmi + Viem in frontend
2. Create wallet connection flow
3. Create hooks:
   - usePropertyRegistry() - interact with registry contract
   - useEscrow() - manage escrow transactions
   - usePropertyNFT() - mint/transfer NFTs
4. Create transaction confirmation UI
5. Support MetaMask, WalletConnect, Coinbase Wallet
```

---

### Order 13: WEB3 Mode UI ⏳
```
Read /Applications/Rest-iN-U-1/.claude/agents/F1-Web.md and continue as that agent.

Task: Build WEB3 mode UI:

1. Create WEB3 theme:
   - Green/Teal primary (#00C9A7)
   - Futuristic, tech aesthetic

2. Create WEB3 pages in frontend/src/app/web3/:
   - /web3/verify/[propertyId] - Blockchain verification
   - /web3/registry - Property registry browser
   - /web3/escrow - Active escrow transactions
   - /web3/wallet - User's Web3 assets

3. Create components:
   - BlockchainVerificationBadge
   - TransactionHistory
   - EscrowStatus
   - WalletConnectButton
```

---

# PHASE 4: DEVOPS & LAUNCH
**Goal**: Deploy, CI/CD, monitoring

| # | Agent | Task | Status |
|---|-------|------|--------|
| 14 | O1-Infrastructure | Vercel + Railway deploy | ⏳ PENDING |
| 15 | O2-CICD | GitHub Actions | ⏳ PENDING |
| 16 | O3-Monitoring | Sentry + Analytics | ⏳ PENDING |

### Order 14: Infrastructure ⏳
```
Read /Applications/Rest-iN-U-1/.claude/agents/O1-Infrastructure.md and continue as that agent.

Task: Setup production infrastructure:

1. Frontend: Deploy to Vercel
   - Configure environment variables
   - Setup custom domain
   - Enable edge functions

2. Backend: Deploy to Railway
   - PostgreSQL database
   - Redis cache
   - Environment config

3. Setup staging environment
4. Configure SSL certificates
```

---

### Order 15: CI/CD ⏳
```
Read /Applications/Rest-iN-U-1/.claude/agents/O2-CICD.md and continue as that agent.

Task: Setup GitHub Actions pipelines:

1. Create .github/workflows/ci.yml:
   - Run tests on PR
   - Lint check
   - Type check
   - Build verification

2. Create .github/workflows/deploy.yml:
   - Auto-deploy main to staging
   - Manual deploy to production
   - Database migrations

3. Create .github/workflows/security.yml:
   - Dependency vulnerability scan
   - Secret detection
```

---

### Order 16: Monitoring ⏳
```
Read /Applications/Rest-iN-U-1/.claude/agents/O3-Monitoring.md and continue as that agent.

Task: Setup monitoring and analytics:

1. Sentry integration:
   - Error tracking frontend + backend
   - Performance monitoring
   - Release tracking

2. Analytics:
   - Mixpanel or PostHog setup
   - Key events: search, property_view, vastu_analysis, report_download

3. Uptime monitoring:
   - Setup BetterUptime or similar
   - Alert on downtime

4. Logging:
   - Structured logging
   - Log aggregation
```

---

# PHASE 5: POLISH & SCALE (Future)

| # | Agent | Task | Status |
|---|-------|------|--------|
| 17 | F2-Mobile | React Native app | ⏳ FUTURE |
| 18 | B4-Integrations | 99acres, RERA APIs | ⏳ FUTURE |
| 19 | Q2-Performance | Speed optimization | ⏳ FUTURE |
| 20 | Q3-Security | Penetration testing | ⏳ FUTURE |

---

# QUICK REFERENCE

## Run Tests
```bash
# Backend
cd backend && npm run test

# Frontend
cd frontend && npm test
```

## Start Development
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

## Database Commands
```bash
cd backend
npx prisma studio        # View data
npx prisma db push       # Sync schema
npx prisma generate      # Generate client
```

---

# PROGRESS SUMMARY

| Phase | Orders | Completed | Status |
|-------|--------|-----------|--------|
| Phase 1: Foundation | 1-6 | 6/6 | ✅ COMPLETE |
| Phase 2: The Moat | 7-10 | 0/4 | ⏳ IN PROGRESS |
| Phase 3: Web3 | 11-13 | 0/3 | ⏳ PENDING |
| Phase 4: DevOps | 14-16 | 0/3 | ⏳ PENDING |
| Phase 5: Scale | 17-20 | 0/4 | ⏳ FUTURE |

**Total**: 6/20 orders complete (30%)

---

**NEXT ORDER**: #7 - D1-VastuEngine (Vastu Vidya + 50 rules)
