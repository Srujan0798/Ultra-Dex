# DistributedCoordinator

The `DistributedCoordinator` class enables multi-instance agent coordination across Ultra-Dex deployments, providing load balancing, failover, and distributed task execution capabilities.

## Features

- **Load Balancing**: Automatically distributes tasks across available instances based on current load
- **Failover**: Handles instance failures gracefully by redistributing tasks to healthy instances
- **Task Coordination**: Coordinates task execution across distributed agents
- **Inter-Instance Communication**: Uses both WebSocket and HTTP for real-time and API-based communication
- **Instance Discovery**: Automatically discovers and connects to other Ultra-Dex instances
- **Health Monitoring**: Continuous health checks and status updates for all connected instances

## Usage

### Basic Setup

```javascript
import { DistributedCoordinator } from 'src/core/orchestration/distributed-coordinator.js';

const coordinator = new DistributedCoordinator({
  instanceId: 'instance-1',
  port: 8080,
  host: 'localhost',
  enableWebSocket: true,
  enableHttpApi: true,
  enableLoadBalancing: true,
  enableFailover: true,
  enableDiscovery: true,
  discoveryUrls: ['http://instance2:8080', 'http://instance3:8080'],
});

await coordinator.initialize();
```

### Configuration Options

- `instanceId`: Unique identifier for this instance (auto-generated if not provided)
- `port`: Port for HTTP/WebSocket server (default: 8080)
- `host`: Host for server binding (default: 'localhost')
- `discoveryUrls`: Array of URLs for peer discovery
- `heartbeatInterval`: Heartbeat interval in milliseconds (default: 30000)
- `healthCheckInterval`: Health check interval in milliseconds (default: 60000)
- `loadBalanceThreshold`: Load threshold for delegation (default: 0.8)
- `maxConcurrentTasks`: Maximum concurrent tasks (default: 10)
- `enableWebSocket`: Enable WebSocket server (default: true)
- `enableHttpApi`: Enable HTTP API server (default: true)
- `enableDiscovery`: Enable peer discovery (default: false)
- `enableFailover`: Enable failover handling (default: false)
- `enableLoadBalancing`: Enable load balancing (default: false)

### Task Submission

```javascript
// Submit a task to the distributed coordinator
const result = await coordinator.submitTask('Analyze this code for performance issues', {
  priority: 1,
  timeout: 30000,
});

// Result contains taskId, result, and success status
console.log(result);
```

### Integration with Orchestrator

The DistributedCoordinator integrates seamlessly with the existing Orchestrator and ExecutionEngine:

```javascript
import { Orchestrator } from './orchestrator.js';
import { DistributedCoordinator } from './distributed-coordinator.js';

// Create orchestrator with distributed coordinator
const orchestrator = new Orchestrator();
const distributedCoord = new DistributedCoordinator({
  enableLoadBalancing: true,
  enableFailover: true,
});

// Initialize both
await orchestrator.initialize();
await distributedCoord.initialize();

// Tasks can now be distributed across instances
```

## API Endpoints

When HTTP API is enabled, the following endpoints are available:

- `GET /health` - Health check
- `GET /ready` - Readiness check
- `GET /metrics` - System metrics
- `GET /api/v1/status` - Coordinator status
- `POST /api/v1/task` - Submit task for delegation
- `GET /api/v1/peers` - List connected peers
- `POST /api/v1/heartbeat` - Receive heartbeat from peers

## WebSocket Events

The coordinator emits the following events:

- `initialized` - Coordinator initialized successfully
- `peer:connected` - New peer connected
- `peer:disconnected` - Peer disconnected
- `peer:status_changed` - Peer status changed
- `peer:failed` - Peer failure detected
- `task:completed` - Task completed successfully
- `task:failed` - Task execution failed
- `shutdown` - Coordinator shutting down

## SDK Integration

The DistributedCoordinator works with the Ultra-Dex SDK's distributed mode:

```javascript
// Enable distributed mode in SDK configuration
const sdk = new UltraDexSDK({
  distributed: {
    enabled: true,
    coordinatorUrl: 'ws://localhost:8080',
    instanceId: 'sdk-instance-1',
  },
});
```

## Monitoring

Get coordinator metrics:

```javascript
const metrics = coordinator.getMetrics();
console.log(metrics);
/*
{
  tasksProcessed: 150,
  tasksFailed: 2,
  tasksDelegated: 75,
  loadBalancingEvents: 12,
  failoverEvents: 1,
  discoveryEvents: 3,
  avgResponseTime: 1250,
  instanceId: 'instance-1',
  status: 'active',
  activeTasks: 3,
  queuedTasks: 1,
  connectedPeers: 2,
  totalPeers: 3,
  load: 0.3,
  uptime: 3600
}
*/
```

## Shutdown

Properly shutdown the coordinator:

```javascript
await coordinator.shutdown();
```

This ensures all connections are closed and resources are cleaned up.</content>
<parameter name="filePath">src/core/orchestration/README-DistributedCoordinator.md
