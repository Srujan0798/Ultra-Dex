# 🏗️ Agent Prompt: DevOps & Infrastructure (v4.2)

---

## 1. cli/lib/docker/generator.js

```javascript
export function generateDockerfile(projectType, options = {}) {
  const templates = {
    node: generateNodeDockerfile,
    python: generatePythonDockerfile,
    go: generateGoDockerfile,
    rust: generateRustDockerfile
  };

  const generator = templates[projectType] || templates.node;
  return generator(options);
}

function generateNodeDockerfile(options) {
  const { nodeVersion = '20', port = 3000, pnpm = false } = options;
  
  return `# Stage 1: Dependencies
FROM node:${nodeVersion}-alpine AS deps
WORKDIR /app

# Install dependencies only when needed
COPY package.json ${pnpm ? 'pnpm-lock.yaml' : 'package-lock.json'} ./
RUN ${pnpm ? 'npm install -g pnpm && pnpm install --frozen-lockfile' : 'npm ci --only=production'}

# Stage 2: Builder
FROM node:${nodeVersion}-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV production
RUN npm run build

# Stage 3: Runner
FROM node:${nodeVersion}-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER nextjs

EXPOSE ${port}
ENV PORT ${port}

CMD ["node", "dist/index.js"]
`;
}

export function generateDockerCompose(services) {
  const serviceConfigs = services.map(s => `
  ${s.name}:
    build: ${s.buildPath || '.'}
    ports:
      - "${s.port}:${s.port}"
    environment:
      - NODE_ENV=production
${s.env ? s.env.map(e => `      - ${e}`).join('\n') : ''}
    depends_on:
${s.depends ? s.depends.map(d => `      - ${d}`).join('\n') : ''}
`).join('');

  return `version: '3.8'
services:${serviceConfigs}

networks:
  default:
    driver: bridge
`;
}
```

---

## 2. cli/lib/k8s/generator.js

```javascript
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
```

---

## 3. templates/cicd/ - CI/CD Templates

### github-actions.yml
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test
      - run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: build
      - run: echo "Deploy to production"
```

### gitlab-ci.yml
```yaml
stages:
  - test
  - build
  - deploy

test:
  stage: test
  image: node:20
  script:
    - npm ci
    - npm test
    - npm run lint
  cache:
    paths:
      - node_modules/

build:
  stage: build
  image: node:20
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/

deploy:
  stage: deploy
  only:
    - main
  script:
    - echo "Deploy to production"
```

---

**SUCCESS:** Docker, K8s, and CI/CD generators complete
