# Controller Agent (Brain/CTO) - Usage Guide

## Quick Start

```javascript
import { ControllerAgent } from './src/core/agents/controller-agent.js';

const controller = new ControllerAgent({ model: 'deepseek-r1' });

const protocol = {
  objective: 'Build REST API with JWT auth',
  requirements: ['User registration', 'Login with JWT'],
  deliverables: { api: { estimatedHours: 8 } },
};

const result = await controller.receiveProtocol(protocol);
console.log('Tasks:', result.tasks.length);
console.log('Assigned:', result.assignments);
```

## Methods

| Method                    | Description                                     |
| ------------------------- | ----------------------------------------------- |
| `receiveProtocol(p)`      | Process protocol → create tasks → assign agents |
| `validateOutput(o, id)`   | Validate output, detect fake fixes              |
| `getMetrics()`            | Get controller metrics                          |
| `completeProtocol(id, r)` | Mark protocol complete                          |
