# 🤖 Agent Prompt: Build Agent System & Swarm (v4.2)

---

## 1. cli/lib/agents/swarm.js - Multi-Agent Orchestration

```javascript
import { EventEmitter } from 'events';

export class AgentSwarm extends EventEmitter {
  constructor(agents = []) {
    super();
    this.agents = agents;
    this.results = new Map();
    this.errors = [];
  }

  addAgent(agent) {
    this.agents.push(agent);
    return this;
  }

  async runParallel(task) {
    this.emit('start', { mode: 'parallel', agentCount: this.agents.length });
    
    const promises = this.agents.map(async (agent, index) => {
      try {
        const result = await agent.execute(task);
        this.results.set(agent.name, result);
        this.emit('agentComplete', { agent: agent.name, result });
        return { agent: agent.name, success: true, result };
      } catch (error) {
        this.errors.push({ agent: agent.name, error });
        this.emit('agentError', { agent: agent.name, error });
        return { agent: agent.name, success: false, error: error.message };
      }
    });

    const results = await Promise.allSettled(promises);
    this.emit('complete', { results: this.results, errors: this.errors });
    return results;
  }

  async runSequential(task) {
    this.emit('start', { mode: 'sequential', agentCount: this.agents.length });
    const results = [];

    for (const agent of this.agents) {
      try {
        const result = await agent.execute(task);
        results.push({ agent: agent.name, success: true, result });
        this.emit('agentComplete', { agent: agent.name, result });
        
        if (result.shouldStop) {
          this.emit('stopped', { agent: agent.name, reason: result.stopReason });
          break;
        }
      } catch (error) {
        results.push({ agent: agent.name, success: false, error: error.message });
        this.emit('agentError', { agent: agent.name, error });
        break;
      }
    }

    return results;
  }

  async runWaterfall(initialContext) {
    this.emit('start', { mode: 'waterfall', agentCount: this.agents.length });
    let context = initialContext;

    for (const agent of this.agents) {
      try {
        context = await agent.execute(context);
        this.emit('agentComplete', { agent: agent.name, context });
      } catch (error) {
        this.emit('agentError', { agent: agent.name, error });
        throw error;
      }
    }

    return context;
  }

  async runCompetitive(task, selectBest) {
    const results = await this.runParallel(task);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success);
    return selectBest(successful.map(r => r.value));
  }
}
```

---

## 2. cli/lib/agents/meta-orchestrator.js

```javascript
export class MetaOrchestrator {
  constructor(agentRegistry) {
    this.registry = agentRegistry;
    this.history = [];
  }

  selectAgents(task) {
    const complexity = this.analyzeComplexity(task);
    const domain = this.classifyDomain(task);
    
    const agents = [];
    
    // Always include Planner for complex tasks
    if (complexity > 0.7) {
      agents.push(this.registry.get('planner'));
    }
    
    // Domain-specific agents
    switch (domain) {
      case 'security':
        agents.push(this.registry.get('security-auditor'));
        agents.push(this.registry.get('pen-tester'));
        break;
      case 'development':
        agents.push(this.registry.get('builder'));
        agents.push(this.registry.get('debugger'));
        break;
      case 'review':
        agents.push(this.registry.get('code-reviewer'));
        agents.push(this.registry.get('quality'));
        break;
    }
    
    // Always include reviewer at the end
    agents.push(this.registry.get('reviewer'));
    
    return agents;
  }

  analyzeComplexity(task) {
    const factors = {
      length: Math.min(task.description.length / 1000, 1),
      files: Math.min((task.files || []).length / 10, 1),
      dependencies: Math.min((task.dependencies || []).length / 5, 1)
    };
    return (factors.length + factors.files + factors.dependencies) / 3;
  }

  classifyDomain(task) {
    const keywords = task.description.toLowerCase();
    if (keywords.includes('security') || keywords.includes('auth')) return 'security';
    if (keywords.includes('review') || keywords.includes('audit')) return 'review';
    if (keywords.includes('build') || keywords.includes('implement')) return 'development';
    return 'general';
  }

  async coordinate(task) {
    const agents = this.selectAgents(task);
    const swarm = new AgentSwarm(agents);
    
    this.history.push({
      task: task.id,
      agents: agents.map(a => a.name),
      startTime: new Date()
    });
    
    return swarm.runWaterfall(task);
  }
}
```

---

## 3. Enhance all 17 agents

Add to each agent in `agents/` directory:

```javascript
export class BaseAgent {
  constructor(name, config = {}) {
    this.name = name;
    this.config = config;
    this.metrics = { calls: 0, avgTime: 0, errors: 0 };
  }

  async healthCheck() {
    return { status: 'healthy', lastCheck: new Date() };
  }

  async execute(task) {
    const start = Date.now();
    this.metrics.calls++;
    
    try {
      const result = await this.run(task);
      this.metrics.avgTime = (this.metrics.avgTime + (Date.now() - start)) / 2;
      return result;
    } catch (error) {
      this.metrics.errors++;
      throw error;
    }
  }

  // Override in subclasses
  async run(task) {
    throw new Error('Not implemented');
  }

  getMetrics() {
    return this.metrics;
  }
}
```

---

**SUCCESS:** Swarm orchestration, meta-orchestrator, and 17 enhanced agents
