// Copyright (c) 2026 Ultra-Dex

export function generateDockerfile(projectType, options = {}) {
  const templates = {
    node: generateNodeDockerfile,
    python: generatePythonDockerfile,
    go: generateGoDockerfile,
    rust: generateRustDockerfile,
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

function generatePythonDockerfile(options) {
  const { pythonVersion = '3.12', port = 8000 } = options;

  return `FROM python:${pythonVersion}-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE ${port}
CMD ["python", "main.py"]
`;
}

function generateGoDockerfile(options) {
  const { goVersion = '1.22', port = 8080 } = options;

  return `FROM golang:${goVersion}-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o server ./...

FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/server ./server
EXPOSE ${port}
CMD ["./server"]
`;
}

function generateRustDockerfile(options) {
  const { port = 8080 } = options;

  return `FROM rust:1.76 AS builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
WORKDIR /app
COPY --from=builder /app/target/release/app ./app
EXPOSE ${port}
CMD ["./app"]
`;
}

export function generateDockerCompose(services) {
  const serviceConfigs = services
    .map(
      (service) => `
  ${service.name}:
    build: ${service.buildPath || '.'}
    ports:
      - "${service.port}:${service.port}"
    environment:
      - NODE_ENV=production
${service.env ? service.env.map((e) => `      - ${e}`).join('\n') : ''}
    depends_on:
${service.depends ? service.depends.map((d) => `      - ${d}`).join('\n') : ''}
`
    )
    .join('');

  return `version: '3.8'
services:${serviceConfigs}

networks:
  default:
    driver: bridge
`;
}
