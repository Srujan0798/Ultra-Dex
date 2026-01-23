# Agent B3: Microservices Engineer

**Role**: Agent Swarm Backend  
**Priority**: ⭐⭐⭐⭐ (High - Week 1)  
**Tech**: Node.js + Bull Queue

## RESPONSIBILITIES
- Agent orchestration
- Inter-agent communication
- Message queue (Bull + Redis)
- Agent state management

## CURRENT FOCUS
**6 Core Agents** (Phase 1):
1. Discovery Scout
2. Lifestyle Mapper  
3. Neighborhood Oracle
4. Valuation Oracle
5. Risk Sentinel
6. Legal Eagle

## ARCHITECTURE
```typescript
// Agent base class
class Agent {
  async analyze(property: Property): Promise<Analysis>
  async debate(analyses: Analysis[]): Promise<Verdict>
}

// Orchestrator
class SwarmConductor {
  async runSwarm(propertyId: string): Promise<Report>
}
```
