# Ultra-Dex Distributed Mode

This directory contains Docker configuration for running Ultra-Dex in distributed mode with automatic coordination between multiple instances.

## Features

- **Multi-instance coordination**: Multiple Ultra-Dex instances that automatically discover and coordinate with each other
- **Load balancing**: Tasks are distributed across instances based on load
- **Health checks**: Built-in health monitoring for all services
- **Service discovery**: Automatic peer discovery and registration
- **NVIDIA GPU support**: Containers configured for NVIDIA GPU acceleration
- **Easy deployment**: Simple scripts for Docker Compose and Kubernetes deployment

## Quick Start

### Using Docker Compose (Recommended for development/testing)

1. **Build and start the cluster:**

   ```bash
   ./deploy-distributed.sh start
   ```

   This starts 3 Ultra-Dex instances that coordinate automatically.

2. **Check cluster status:**

   ```bash
   ./deploy-distributed.sh status
   ```

3. **Scale the cluster:**

   ```bash
   ./deploy-distributed.sh scale 5
   ```

4. **View logs:**

   ```bash
   ./deploy-distributed.sh logs ultradex-1
   ```

5. **Stop the cluster:**
   ```bash
   ./deploy-distributed.sh stop
   ```

### Using Kubernetes

1. **Deploy to Kubernetes:**

   ```bash
   ./deploy-distributed.sh k8s-deploy
   ```

2. **Check deployment status:**
   ```bash
   kubectl get pods
   kubectl logs -f deployment/ultradex-distributed
   ```

## Architecture

### Components

- **Ultra-Dex Instances**: Main application containers running the distributed coordinator
- **Nginx Load Balancer**: (Optional) Load balances requests across instances
- **Service Discovery**: Instances automatically discover peers via HTTP/WebSocket
- **Health Checks**: Each instance exposes `/health` and `/ready` endpoints

### Network Communication

- **Coordinator Port** (8080): Used for inter-instance coordination via HTTP API and WebSocket
- **Dashboard Port** (3000): Web interface (if enabled)
- **Discovery**: Instances use `ULTRA_DEX_DISCOVERY_URLS` to find initial peers

### Environment Variables

| Variable                          | Description                           | Default        |
| --------------------------------- | ------------------------------------- | -------------- |
| `ULTRA_DEX_INSTANCE_ID`           | Unique identifier for this instance   | Auto-generated |
| `ULTRA_DEX_COORDINATOR_PORT`      | Port for coordinator API              | 8080           |
| `ULTRA_DEX_DISCOVERY_URLS`        | URLs of other instances for discovery | None           |
| `ULTRA_DEX_ENABLE_LOAD_BALANCING` | Enable task load balancing            | true           |
| `ULTRA_DEX_ENABLE_DISCOVERY`      | Enable peer discovery                 | true           |
| `ULTRA_DEX_MAX_CONCURRENT_TASKS`  | Max tasks per instance                | 10             |

## Configuration

### Docker Compose Configuration

Edit `docker-compose.yml` to:

- Change number of instances
- Modify resource limits
- Add environment variables
- Configure volumes for persistent data

### Kubernetes Configuration

Edit `k8s-deployment.yaml` to:

- Change replica count
- Modify resource requests/limits
- Add ConfigMaps/Secrets for sensitive data
- Configure persistent volumes

## Monitoring and Troubleshooting

### Health Checks

Each instance exposes:

- `/health`: Overall health status
- `/ready`: Readiness for accepting traffic
- `/metrics`: Performance metrics

### Common Issues

1. **Instances can't discover each other:**
   - Check `ULTRA_DEX_DISCOVERY_URLS` environment variables
   - Verify network connectivity between containers
   - Check firewall settings

2. **Tasks not being distributed:**
   - Verify `ULTRA_DEX_ENABLE_LOAD_BALANCING=true`
   - Check instance load levels
   - Review coordinator logs for errors

3. **NVIDIA GPU not detected:**
   - Ensure `--runtime=nvidia` or `--gpus all` is used
   - Check NVIDIA drivers on host
   - Verify CUDA compatibility

### Logs

View logs for specific instances:

```bash
# Docker Compose
docker-compose logs ultradex-1

# Kubernetes
kubectl logs -f deployment/ultradex-distributed
```

## Scaling

### Horizontal Scaling

Increase the number of instances:

```bash
# Docker Compose
./deploy-distributed.sh scale 10

# Kubernetes
kubectl scale deployment ultradex-distributed --replicas=10
```

### Vertical Scaling

Increase resources per instance by editing the deployment configurations.

## Security Considerations

- Use secrets management for API keys
- Configure network policies in Kubernetes
- Enable TLS for inter-instance communication
- Regularly update base images for security patches

## Development

### Adding New Instances

1. Add new service block in `docker-compose.yml`
2. Update `ULTRA_DEX_DISCOVERY_URLS` for all instances
3. Update nginx configuration if using load balancer

### Custom Configuration

Create a `.env.local` file with your custom settings:

```
NODE_ENV=production
LOG_LEVEL=debug
OPENAI_API_KEY=your_key_here
# Add other configuration
```

## API Usage

Once running, you can interact with the distributed cluster:

```bash
# Check cluster status
curl http://localhost:8081/api/v1/status

# Submit a task
curl -X POST http://localhost:8081/api/v1/task \
  -H "Content-Type: application/json" \
  -d '{"task": "analyze code", "priority": 1}'

# List peers
curl http://localhost:8081/api/v1/peers
```

## Contributing

When making changes to the distributed configuration:

1. Test with both Docker Compose and Kubernetes
2. Update this README with any new features
3. Ensure backward compatibility
4. Add health checks for new components
