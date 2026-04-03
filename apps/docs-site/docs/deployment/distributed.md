# Distributed Deployment Guide

Ultra-Dex v2.0 introduces a distributed architecture that enables horizontal scaling, high availability, and global deployment capabilities. This guide covers setting up and managing distributed Ultra-Dex deployments.

## Architecture Overview

The distributed architecture consists of several key components:

```
┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │  API Gateway    │
│     (Nginx)     │    │   (Kong/Envoy)  │
└─────────────────┘    └─────────────────┘
          │                       │
          └───────────────────────┘
                    │
          ┌─────────────────┐
          │ Orchestration   │
          │   Services      │
          │   (Kubernetes)  │
          └─────────────────┘
                    │
          ┌─────────────────┐
          │   Worker Nodes  │
          │   (Docker/K8s)  │
          └─────────────────┘
                    │
          ┌─────────────────┐
          │   Data Layer    │
          │ (PostgreSQL +   │
          │   Redis/Victor) │
          └─────────────────┘
```

## Prerequisites

- Kubernetes cluster (v1.24+)
- Helm v3.8+
- Docker registry access
- Cloud provider CLI (AWS/GCP/Azure)
- Domain name with DNS management

## Quick Start Deployment

### 1. Clone and Setup

```bash
git clone https://github.com/Srujan0798/Ultra-Dex.git
cd Ultra-Dex
npm install
```

### 2. Configure Environment

Create a `.env` file with your configuration:

```bash
# Core Configuration
NODE_ENV=production
ULTRA_DEX_VERSION=2.0.0

# Database
DATABASE_URL=postgresql://user:password@postgres:5432/ultradex
REDIS_URL=redis://redis:6379

# AI Providers
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_AI_API_KEY=your-google-key

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key

# Distributed Settings
CLUSTER_MODE=true
WORKER_COUNT=5
REGION=us-east-1
```

### 3. Deploy with Helm

```bash
# Add Ultra-Dex Helm repository
helm repo add ultra-dex https://charts.ultra-dex.ai
helm repo update

# Install Ultra-Dex
helm install ultra-dex ultra-dex/ultra-dex \
  --namespace ultra-dex \
  --create-namespace \
  --set image.tag=v2.0.0 \
  --set replicaCount=3 \
  --set worker.replicaCount=5
```

### 4. Verify Deployment

```bash
# Check pod status
kubectl get pods -n ultra-dex

# Check services
kubectl get svc -n ultra-dex

# Check ingress
kubectl get ingress -n ultra-dex

# View logs
kubectl logs -n ultra-dex deployment/ultra-dex-orchestrator
```

## Component Configuration

### Orchestration Services

The core orchestration layer handles task distribution and agent coordination:

```yaml
# orchestrator-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ultra-dex-orchestrator
  namespace: ultra-dex
spec:
  replicas: 3
  selector:
    matchLabels:
      app: orchestrator
  template:
    metadata:
      labels:
        app: orchestrator
    spec:
      containers:
      - name: orchestrator
        image: ultra-dex/orchestrator:v2.0.0
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: ultra-dex-config
        - secretRef:
            name: ultra-dex-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Worker Nodes

Worker nodes execute tasks and run agent workflows:

```yaml
# worker-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ultra-dex-worker
  namespace: ultra-dex
spec:
  replicas: 10
  selector:
    matchLabels:
      app: worker
  template:
    metadata:
      labels:
        app: worker
    spec:
      containers:
      - name: worker
        image: ultra-dex/worker:v2.0.0
        envFrom:
        - configMapRef:
            name: ultra-dex-config
        - secretRef:
            name: ultra-dex-secrets
        resources:
          requests:
            memory: "1Gi"
            cpu: "1000m"
          limits:
            memory: "2Gi"
            cpu: "2000m"
        volumeMounts:
        - name: workspace
          mountPath: /workspace
      volumes:
      - name: workspace
        emptyDir: {}
```

### Database Layer

PostgreSQL with Redis for caching and session storage:

```yaml
# database-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: ultra-dex
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: ultradex
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: password
        volumeMounts:
        - name: postgres-data
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
      volumes:
      - name: postgres-data
        persistentVolumeClaim:
          claimName: postgres-pvc
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: ultra-dex
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

## Load Balancing and Ingress

### NGINX Ingress Controller

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ultra-dex-ingress
  namespace: ultra-dex
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api.ultra-dex.ai
    - dashboard.ultra-dex.ai
    secretName: ultra-dex-tls
  rules:
  - host: api.ultra-dex.ai
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ultra-dex-api
            port:
              number: 80
  - host: dashboard.ultra-dex.ai
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ultra-dex-dashboard
            port:
              number: 80
```

### Service Mesh (Istio)

For advanced traffic management and observability:

```yaml
# istio-gateway.yaml
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: ultra-dex-gateway
  namespace: ultra-dex
spec:
  selector:
    istio: ingressgateway
  servers:
  - port:
      number: 80
      name: http
      protocol: HTTP
    hosts:
    - api.ultra-dex.ai
    - dashboard.ultra-dex.ai
  - port:
      number: 443
      name: https
      protocol: HTTPS
    tls:
      mode: SIMPLE
      credentialName: ultra-dex-tls
    hosts:
    - api.ultra-dex.ai
    - dashboard.ultra-dex.ai
```

## Cloud-Specific Deployments

### AWS EKS

```bash
# Create EKS cluster
eksctl create cluster \
  --name ultra-dex-cluster \
  --version 1.28 \
  --region us-east-1 \
  --nodegroup-name workers \
  --node-type t3.large \
  --nodes 3 \
  --nodes-min 1 \
  --nodes-max 10 \
  --managed

# Install Ultra-Dex
helm install ultra-dex ultra-dex/ultra-dex \
  --namespace ultra-dex \
  --set aws.enabled=true \
  --set aws.region=us-east-1
```

### Google Cloud GKE

```bash
# Create GKE cluster
gcloud container clusters create ultra-dex-cluster \
  --num-nodes=3 \
  --machine-type=e2-standard-4 \
  --region=us-central1

# Get credentials
gcloud container clusters get-credentials ultra-dex-cluster --region=us-central1

# Install Ultra-Dex
helm install ultra-dex ultra-dex/ultra-dex \
  --namespace ultra-dex \
  --set gcp.enabled=true \
  --set gcp.projectId=your-project-id
```

### Azure AKS

```bash
# Create AKS cluster
az aks create \
  --resource-group ultra-dex-rg \
  --name ultra-dex-cluster \
  --node-count 3 \
  --node-vm-size Standard_DS2_v2 \
  --enable-addons monitoring \
  --generate-ssh-keys

# Get credentials
az aks get-credentials --resource-group ultra-dex-rg --name ultra-dex-cluster

# Install Ultra-Dex
helm install ultra-dex ultra-dex/ultra-dex \
  --namespace ultra-dex \
  --set azure.enabled=true \
  --set azure.resourceGroup=ultra-dex-rg
```

## Monitoring and Observability

### Prometheus Metrics

```yaml
# prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: ultra-dex
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
    - job_name: 'ultra-dex-orchestrator'
      static_configs:
      - targets: ['ultra-dex-orchestrator:9090']
    - job_name: 'ultra-dex-worker'
      static_configs:
      - targets: ['ultra-dex-worker:9090']
    - job_name: 'postgres'
      static_configs:
      - targets: ['postgres:9187']
    - job_name: 'redis'
      static_configs:
      - targets: ['redis:9121']
```

### Grafana Dashboards

Key metrics to monitor:
- Request latency and throughput
- Error rates by component
- Resource utilization (CPU, memory, disk)
- Queue depths and processing times
- AI provider API usage and costs

### Logging with ELK Stack

```yaml
# fluent-bit-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
  namespace: ultra-dex
data:
  fluent-bit.conf: |
    [SERVICE]
        Flush         5
        Log_Level     info
        Daemon        off

    [INPUT]
        Name              tail
        Path              /var/log/containers/*ultra-dex*.log
        Parser            docker
        Tag               kube.*
        Refresh_Interval  5

    [OUTPUT]
        Name  elasticsearch
        Match kube.*
        Host  elasticsearch
        Port  9200
        Index ultra-dex
```

## Scaling Strategies

### Horizontal Pod Autoscaling

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ultra-dex-worker-hpa
  namespace: ultra-dex
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ultra-dex-worker
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Cluster Autoscaling

For cloud providers, enable cluster autoscaling to automatically adjust node counts based on demand.

## Backup and Disaster Recovery

### Database Backups

```yaml
# backup-job.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: ultra-dex
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: postgres-backup
            image: postgres:15
            command:
            - /bin/bash
            - -c
            - |
              pg_dump -h postgres -U $POSTGRES_USER $POSTGRES_DB > /backup/backup.sql
            env:
            - name: POSTGRES_USER
              valueFrom:
                secretKeyRef:
                  name: db-secrets
                  key: username
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-secrets
                  key: password
            - name: POSTGRES_DB
              value: ultradex
            volumeMounts:
            - name: backup-storage
              mountPath: /backup
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
```

### Multi-Region Deployment

For high availability across regions:

```yaml
# multi-region-config.yaml
global:
  cluster:
    primary: us-east-1
    secondary: us-west-2

regions:
  us-east-1:
    orchestrator:
      replicas: 3
    worker:
      replicas: 10
  us-west-2:
    orchestrator:
      replicas: 2
    worker:
      replicas: 5
```

## Security Considerations

### Network Policies

```yaml
# network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ultra-dex-network-policy
  namespace: ultra-dex
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3000
  - from:
    - podSelector:
        matchLabels:
          app: orchestrator
    ports:
    - protocol: TCP
      port: 3001
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - podSelector:
        matchLabels:
          app: redis
    ports:
    - protocol: TCP
      port: 6379
  - to: []
    ports:
    - protocol: TCP
      port: 443  # HTTPS for external APIs
```

### Secrets Management

Use external secret management:

```yaml
# external-secrets.yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: ultra-dex-secrets
  namespace: ultra-dex
spec:
  refreshInterval: 15s
  secretStoreRef:
    name: aws-secretsmanager
    kind: SecretStore
  target:
    name: ultra-dex-runtime-secrets
    creationPolicy: Owner
  data:
  - secretKey: openai-api-key
    remoteRef:
      key: prod/ultra-dex/openai
      property: api-key
  - secretKey: jwt-secret
    remoteRef:
      key: prod/ultra-dex/jwt
      property: secret
```

## Performance Optimization

### Caching Strategies

- Redis for session and API response caching
- CDN for static assets
- Database query result caching
- AI model response caching

### Resource Optimization

```yaml
# resource-optimization.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ultra-dex-performance-config
  namespace: ultra-dex
data:
  config.yaml: |
    caching:
      enabled: true
      ttl: 3600
      maxSize: 100MB
    worker:
      maxConcurrentTasks: 5
      taskTimeout: 300000
    database:
      connectionPoolSize: 20
      statementCacheSize: 100
    ai:
      requestTimeout: 60000
      retryAttempts: 3
      circuitBreaker:
        failureThreshold: 5
        recoveryTimeout: 60000
```

## Troubleshooting Distributed Deployments

### Common Issues

1. **Pod Scheduling Failures**
   ```bash
   kubectl describe pod <pod-name>
   kubectl get events --sort-by=.metadata.creationTimestamp
   ```

2. **Service Mesh Issues**
   ```bash
   istioctl proxy-status
   istioctl proxy-config routes <pod-name>
   ```

3. **Database Connection Issues**
   ```bash
   kubectl exec -it postgres-0 -- psql -U ultradex -d ultradex
   ```

4. **Load Balancing Problems**
   ```bash
   kubectl logs -n ingress-nginx deployment/ingress-nginx-controller
   ```

### Health Checks

```bash
# Overall cluster health
kubectl get componentstatuses

# Pod health
kubectl get pods -n ultra-dex --field-selector=status.phase!=Running

# Service health
kubectl get endpoints -n ultra-dex

# Node health
kubectl describe nodes
```

### Log Aggregation

```bash
# View centralized logs
kubectl logs -n ultra-dex -l app=orchestrator --tail=100 -f

# Search logs across pods
kubectl logs -n ultra-dex --selector=app=worker --tail=50 | grep ERROR
```

## Cost Optimization

### Resource Rightsizing

Monitor resource usage and adjust requests/limits:

```bash
# Check resource usage
kubectl top pods -n ultra-dex
kubectl top nodes

# Adjust resource requests
kubectl edit deployment ultra-dex-worker
```

### Spot Instances

Use spot instances for worker nodes to reduce costs:

```yaml
# spot-instance-deployment.yaml
spec:
  template:
    spec:
      tolerations:
      - key: "kubernetes.azure.com/scalesetpriority"
        operator: "Equal"
        value: "spot"
        effect: "NoSchedule"
      nodeSelector:
        kubernetes.azure.com/scalesetpriority: spot
```

### Auto-scaling Based on Cost

Implement cost-aware scaling policies that consider:
- Current spot instance pricing
- Reserved instance utilization
- Time-of-day pricing variations

## Migration Guide

### From Single-Node to Distributed

1. **Assessment Phase**
   - Analyze current workload patterns
   - Identify bottlenecks and scaling requirements
   - Plan data migration strategy

2. **Infrastructure Setup**
   - Provision Kubernetes cluster
   - Set up databases and storage
   - Configure networking and security

3. **Data Migration**
   ```bash
   # Export from single node
   pg_dump -h localhost -U ultradex ultradex > backup.sql

   # Import to distributed database
   kubectl exec -it postgres-0 -n ultra-dex -- psql -U ultradex -d ultradex < backup.sql
   ```

4. **Application Deployment**
   - Deploy orchestrator and worker services
   - Configure load balancing
   - Update DNS and certificates

5. **Testing and Validation**
   - Run load tests
   - Validate data consistency
   - Test failover scenarios

### Rollback Strategy

Always maintain a rollback plan:

```bash
# Quick rollback to previous version
helm rollback ultra-dex 1

# Or redeploy single-node version
helm uninstall ultra-dex
kubectl apply -f single-node-deployment.yaml
```

## Best Practices

### Operational Excellence

1. **Monitoring**: Implement comprehensive monitoring with alerts
2. **Logging**: Centralized logging with structured formats
3. **Backup**: Regular automated backups with testing
4. **Security**: Defense in depth with multiple security layers
5. **Performance**: Continuous monitoring and optimization

### Development Workflow

1. **CI/CD**: Automated testing and deployment pipelines
2. **GitOps**: Infrastructure as code with GitOps practices
3. **Blue-Green**: Zero-downtime deployments with blue-green strategy
4. **Canary**: Gradual rollout with canary deployments

### Compliance and Governance

1. **Audit Trails**: Comprehensive logging for compliance
2. **Access Control**: Role-based access control (RBAC)
3. **Data Protection**: Encryption at rest and in transit
4. **Regular Audits**: Security and compliance audits

This distributed deployment guide provides a comprehensive foundation for scaling Ultra-Dex to production workloads. For specific cloud provider optimizations or advanced configurations, consult the cloud-specific documentation sections.