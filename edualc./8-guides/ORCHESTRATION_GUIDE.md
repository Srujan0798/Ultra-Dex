# Claude Code Agent Orchestration Guide

> **You are C0 - CEO/Orchestrator**  
> **Goal**: Build REST-iN-U by Jan 15 using 28 autonomous agents

---

## QUICK START

### In Claude Code, Reference Agents Like This:
```
@C1-CTO review this database schema
@F1-Web create the ESTATE mode search page
@B1-API implement property search endpoint
@Q1-TestAutomation write tests for the new endpoint
```

### Example Session:
```
You: "Phase 1 starts today. Let's build ESTATE mode."

1. "@C1-CTO Read HYBRID-FINAL.md and approve architecture for Phase 1"
   → C1 responds with approved architecture

2. "@B2-Database Create Property model with Vastu relation"
   → B2 creates schema, asks C1 for approval

3. "@C1-CTO Approve B2's Property schema"
   → C1 approves with minor changes

4. "@B2-Database Make C1's requested changes and create migration"
   → B2 creates migration: npx prisma migrate dev

5. "@B1-API Implement GET /api/properties endpoint"
   → B1 writes route using Prisma

6. "@F1-Web Create ESTATE search page that calls B1's API"
   → F1 creates Next.js page + components

7. "@Q1-TestAutomation Write tests for B1 API endpoint"
   → Q1 writes Jest tests

8. "@CQ1-CodeReview Review F1's PR"
   → CQ1 reviews, approves

9. "@PR1-PRReview Merge F1's PR to main"
   → PR1 merges, deletes branch
```

---

## AGENT WORKFLOW

### For New Features:
```
PM (C2) → CTO (C1) → Implementers (F1/B1/B2) → Tests (Q1) → Review (CQ1/PR1) → Deploy (O1/O2)
```

### For Bugs:
```
BUG1 identifies → Fixes → Q1 adds regression test → PR1 merges
```

### For Research:
```
R1 researches → Reports to C1 → C1 decides → Team implements
```

---

## PRIORITY WORKFLOW (Week 1)

**Day 1-2: Database & API**
```
@C1-CTO Approve overall Phase 1 architecture
@B2-Database Create Property, VastuAnalysis, ClimateAnalysis models
@C1-CTO Review and approve schema
@B2-Database Create migration and seed data
@B1-API Implement property search endpoint
@Q1-TestAutomation Write API tests
```

**Day 3-4: Frontend**
```
@F3-UIUX Create theme system (Blue/Saffron/Green)
@F1-Web Build ESTATE mode search page
@F1-Web Build PropertyCard component
@F1-Web Build DebatePanel component
@Q1-TestAutomation Write component tests
```

**Day 5-6: Agent Swarm**
```
@B3-Microservices Create agent orchestration framework
@B3-Microservices Implement 6 core agents
@D1-VastuEngine Create Vastu scoring logic
@D2-ClimateRisk Create climate risk analyzer
```

**Day 7: Integration & Deploy**
```
@Q2-Performance Optimize page load
@Q3-Security Security audit
@O1-Infrastructure Deploy to Vercel + Railway
@DOC1-TechnicalWriter Update README
```

---

## HANDOFF PROTOCOL

When agent completes work:
```
From: @B1-API
To: @F1-Web
Status: ✅ COMPLETE
Deliverable: GET /api/properties endpoint
Details: 
- URL: /api/properties
- Query params: city, minPrice, maxPrice, propertyType
- Response format: { success, data: { properties, pagination } }
Next Action: Integrate in frontend search component
```

---

## TROUBLESHOOTING

**If stuck**: Ask @R1-Research for solutions  
**If bugs**: Assign to @BUG1-BugFixer immediately  
**If slow**: @Q2-Performance optimizes  
**If security issue**: @Q3-Security audits

---

## SUCCESS METRICS (By Jan 15)

- [ ] ESTATE mode search works
- [ ] Property listings display
- [ ] Vastu scores show
- [ ] 6 agents operational
- [ ] Visible debate UI works
- [ ] Deployed to production

---

**You are the conductor. Direct the orchestra. Build REST-iN-U!** 🚀
