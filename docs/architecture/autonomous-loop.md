# Autonomous Loop Architecture

## Component Diagram

```
┌─────────────────────────────────────────────────┐
│              AutonomousAgent                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Planning │→│ Decompose│→│ ExecutionController│
│  │ Engine   │ │ Tasks    │ │                  │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
│       ↓            ↓              ↓              │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │Validation│ │ Memory   │ │ ApprovalGates    │ │
│  │ Layer    │ │ Bridge   │ │                  │ │
│  └──────────┘ └──────────┘ └──────────┘ │
└─────────────────────────────────────────────────┘
```

## Data Flow

```
Goal → PlanningEngine → Tasks → ExecutionController → Results → ValidationLayer → MemoryBridge
```

## Event System

- `phase:start`, `phase:complete` - Lifecycle events for each phase
- `task:start`, `task:complete`, `task:failed` - Task execution events
- `validation:passed`, `validation:failed` - Validation results
- `checkpoint:saved` - Checkpoint creation events

## Circuit Breaker States

```
CLOSED → OPEN → HALF_OPEN → CLOSED
```

- **CLOSED**: Normal operation, requests allowed
- **OPEN**: Failing state, requests rejected immediately
- **HALF_OPEN**: Testing state, single request allowed to test recovery
