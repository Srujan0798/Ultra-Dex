# Agent Guide Overview

Ultra-Dex orchestrates 18 specialized AI agents organized in 6 tiers to handle complex software development tasks. Each agent has specific expertise and responsibilities, enabling coordinated multi-agent workflows.

## Agent Architecture

### 6-Tier Organization

Ultra-Dex agents are organized into 6 strategic tiers:

1. **Leadership Tier**: Strategic decision-making and architecture
2. **Development Tier**: Core implementation and coding
3. **Security Tier**: Security and authentication concerns
4. **DevOps Tier**: Deployment and infrastructure
5. **Quality Tier**: Testing, documentation, and review
6. **Specialist Tier**: Domain-specific expertise

### Agent Responsibilities

Each agent operates with defined roles and responsibilities:

| Agent | Tier | Primary Role | Key Responsibilities |
|-------|------|--------------|---------------------|
| @CTO | Leadership | Architecture & Strategy | Technology decisions, scalability, trade-off analysis |
| @Planner | Leadership | Project Planning | Task breakdown, timeline, dependencies |
| @Research | Leadership | Research & Evaluation | Technology evaluation, benchmarking |
| @Backend | Development | Server Logic | APIs, business logic, data processing |
| @Frontend | Development | Client Interface | UI/UX, client-side functionality |
| @Database | Development | Data Management | Schema design, queries, migrations |
| @Auth | Security | Authentication | Security protocols, user management |
| @Security | Security | Security Audit | Vulnerability assessment, security implementation |
| @DevOps | DevOps | Deployment | CI/CD, infrastructure, monitoring |
| @Testing | Quality | Quality Assurance | Test creation, execution, validation |
| @Documentation | Quality | Documentation | Technical docs, API references |
| @Reviewer | Quality | Code Review | Quality checks, architectural compliance |
| @Debugger | Quality | Debugging | Bug investigation, root cause analysis |
| @Performance | Specialist | Performance | Optimization, bottleneck identification |
| @Refactoring | Specialist | Code Quality | Code improvement, design patterns |
| @Orchestrator | Leadership | Coordination | Multi-agent workflow management |

## Agent Communication

### Context Sharing
Agents share context through:
- **Knowledge Graph**: Persistent memory system
- **Implementation Plan**: Shared project blueprint
- **State File**: Current project status
- **MCP Protocol**: Real-time communication

### Task Delegation
The @Orchestrator agent manages task delegation:
- Determines optimal agent for each task
- Coordinates inter-agent dependencies
- Monitors progress and status
- Handles error recovery

## Using Agents

### Individual Agent Execution
Run a specific agent:

```bash
# Run the planner agent
ultra-dex run @planner "Break down user authentication feature"

# Run the backend agent
ultra-dex run @backend "Implement login API endpoint"

# Run the security agent
ultra-dex run @security "Audit authentication implementation"
```

### Multi-Agent Swarms
Coordinate multiple agents:

```bash
# Run a complete feature implementation swarm
ultra-dex swarm "Implement user registration with email verification"

# This triggers: @Planner → @CTO → @Database → @Backend → @Frontend → @Security → @Reviewer → @DevOps
```

### Agent Configuration
Configure agents through the configuration file:

```json
{
  "agents": {
    "defaultProvider": "anthropic",
    "model": "claude-3-5-sonnet-20241022",
    "maxTokens": 4096,
    "temperature": 0.2
  }
}
```

## Agent Verification Framework

Every agent follows a 21-step verification framework:

1. Atomic Scope Defined
2. Context Loaded
3. Architecture Alignment
4. Security Patterns Applied
5. Type Safety Check
6. Error Handling Strategy
7. API Documentation Updated
8. Database Schema Verified
9. Environment Variables Set
10. Implementation Complete
11. Console Logs Removed
12. Edge Cases Handled
13. Performance Check
14. Accessibility (A11y) Check
15. Cross-browser Check
16. Unit Tests Passed
17. Integration Tests Passed
18. Linting & Formatting
19. Code Review Approved
20. Migration Scripts Ready
21. Deployment Readiness

## Custom Agents

Create custom agents for domain-specific tasks:

```javascript
// custom-agents/payment-agent.js
export default {
  name: '@Payment',
  description: 'Handles payment processing and billing',
  tier: '4-quality',
  prompt: `You are a payment processing expert...
  [Detailed agent prompt here]`
};
```

Register custom agents in configuration:

```json
{
  "customAgents": [
    "./custom-agents/payment-agent.js"
  ]
}
```

## Agent Marketplace

Browse and install community-contributed agents:

```bash
# List available agents
ultra-dex agents marketplace

# Install an agent
ultra-dex agents install @payment-expert

# Update agents
ultra-dex agents update
```

## Best Practices

- Use the appropriate agent for each task type
- Leverage swarms for complex, multi-component features
- Monitor agent status and progress
- Customize agent prompts for your domain
- Follow the verification framework for consistency
- Share context between agents effectively

## Troubleshooting

### Agent Not Responding
- Check API key configuration
- Verify agent availability
- Review error logs

### Unexpected Behavior
- Review agent prompt customization
- Check configuration settings
- Validate context sharing

## Next Steps

- Explore [Individual Agent Commands](./list.md)
- Learn about [Custom Agent Creation](./custom.md)
- Understand [Multi-Agent Orchestration](./orchestration.md)