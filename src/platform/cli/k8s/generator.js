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

export function generateIngress(config) {
  const {
    name,
    host,
    serviceName = `${name}-service`,
    servicePort = config?.port || 80,
    path = '/',
    className,
    tlsSecret,
  } = config;

  const ingressClass = className
    ? `  ingressClassName: ${className}\n`
    : '';

  const tlsBlock = tlsSecret && host
    ? `  tls:\n  - hosts:\n    - ${host}\n    secretName: ${tlsSecret}\n`
    : '';

  return `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${name}-ingress
spec:
${ingressClass}${tlsBlock}  rules:
  - host: ${host || 'example.local'}
    http:
      paths:
        - path: ${path}
          pathType: Prefix
          backend:
            service:
              name: ${serviceName}
              port:
                number: ${servicePort}
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

export function generateConfigMap(config) {
  const { name, data = {}, namespace } = config;
  const lines = Object.entries(data).map(
    ([key, value]) => `  ${key}: "${String(value).replace(/"/g, '\\"')}"`
  );

  return `apiVersion: v1
kind: ConfigMap
metadata:
  name: ${name}-config
${namespace ? `  namespace: ${namespace}\n` : ''}data:
${lines.length ? lines.join('\n') : '  {}'}
`;
}

export function generateSecret(config) {
  const { name, data = {}, namespace, type = 'Opaque', encode = true } = config;
  const entries = Object.entries(data).map(([key, value]) => {
    const raw = value ?? '';
    const encoded = encode ? Buffer.from(String(raw)).toString('base64') : String(raw);
    return `  ${key}: ${encoded}`;
  });

  return `apiVersion: v1
kind: Secret
metadata:
  name: ${name}-secret
${namespace ? `  namespace: ${namespace}\n` : ''}type: ${type}
data:
${entries.length ? entries.join('\n') : '  {}'}
`;
}

export function generateNamespace(name) {
  if (!name) {
    throw new Error('Namespace name is required');
  }

  return `apiVersion: v1
kind: Namespace
metadata:
  name: ${name}
`;
}

export function generateManifests(config) {
  const parts = [];
  if (!config || !config.name || !config.image || !config.port) {
    throw new Error('Missing required config: name, image, port');
  }
  parts.push(generateDeployment(config));
  parts.push(generateService(config));
  if (config.hpa !== false) {
    parts.push(generateHPA(config));
  }
  return parts.join('\n---\n');
}

export default {
  generateDeployment,
  generateService,
  generateIngress,
  generateHPA,
  generateConfigMap,
  generateSecret,
  generateNamespace,
  generateManifests,
};

/**
 * Handle errors in generator module
 * @param {Error} error - The error to handle
 * @param {string} [context='generator'] - Error context
 */
function handleModuleError(error, context = 'generator') {
  try {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[${context}] Error: ${message}`);
  } catch (_) {
    // Fail silently
  }
}
