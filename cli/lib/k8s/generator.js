// Copyright (c) 2026 Ultra-Dex

export function generateDeployment(config) {
  const { name, image, replicas = 3, port, resources } = config;

  return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${name}
  labels:
    app: ${name}
spec:
  replicas: ${replicas}
  selector:
    matchLabels:
      app: ${name}
  template:
    metadata:
      labels:
        app: ${name}
    spec:
      containers:
      - name: ${name}
        image: ${image}
        ports:
        - containerPort: ${port}
        resources:
          requests:
            memory: "${resources?.memory || '128Mi'}"
            cpu: "${resources?.cpu || '100m'}"
          limits:
            memory: "${resources?.memoryLimit || '256Mi'}"
            cpu: "${resources?.cpuLimit || '500m'}"
        livenessProbe:
          httpGet:
            path: /health
            port: ${port}
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: ${port}
          initialDelaySeconds: 5
          periodSeconds: 5
`;
}

export function generateService(config) {
  const { name, port, targetPort, type = 'ClusterIP' } = config;

  return `apiVersion: v1
kind: Service
metadata:
  name: ${name}-service
spec:
  type: ${type}
  selector:
    app: ${name}
  ports:
  - port: ${port}
    targetPort: ${targetPort || port}
`;
}

export function generateHPA(config) {
  const { name, minReplicas = 2, maxReplicas = 10, targetCPU = 70 } = config;

  return `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${name}-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${name}
  minReplicas: ${minReplicas}
  maxReplicas: ${maxReplicas}
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: ${targetCPU}
`;
}
