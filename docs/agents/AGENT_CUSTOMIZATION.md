# Agent Customization Guide

## Overview
Ultra-Dex agents are customizable through configuration files, environment variables, and prompt templates.

## Configuration

### Agent Config (`ultra-dex.config.json`)
```json
{
  "agent": {
    "name": "custom-agent",
    "provider": "openai",
    "model": "gpt-4",
    "maxSteps": 10,
    "temperature": 0.7
  }
}
```

### Environment Variables
| Variable | Description |
|----------|-------------|
| `ULTRA_DEX_AGENT_NAME` | Override agent name |
| `ULTRA_DEX_MAX_STEPS` | Maximum execution steps |
| `ULTRA_DEX_PROVIDER` | Default AI provider |
| `ULTRA_DEX_MODEL` | Default model |

## Custom Prompts
Place custom prompts in `.ultra-dex/prompts/`:
- `system.md` - System prompt override
- `planner.md` - Planning agent prompt
- `coder.md` - Coding agent prompt

## Agent Types
| Agent | Purpose |
|-------|---------|
| `planner` | Break down features into tasks |
| `coder` | Generate code |
| `reviewer` | Code review |
| `tester` | Write and run tests |
| `architect` | System design |

## Swarm Mode
```bash
ultra-dex swarm "Add authentication" --agents planner,coder,reviewer,tester
```

## Custom Agent Registration
Create agent definition in `apps/cli/lib/agents/`:
```js
export const myAgent = {
  name: 'my-agent',
  capabilities: ['custom-capability'],
  prompt: 'You are a custom agent...',
};
```
