# Ultra-Dex Production Dockerfile (v6.0.0)
# Optimized for Meta-Layer Orchestration

FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite-dev

WORKDIR /app

# Copy monorepo root config
COPY package*.json ./
COPY apps/cli/package*.json ./apps/cli/
COPY apps/core-api/package*.json ./apps/core-api/
COPY src/core/package*.json ./src/core/

# Install dependencies (Workspaces aware)
RUN npm install --omit=dev

# Runtime stage
FROM node:20-alpine AS runtime

RUN apk add --no-cache tini curl bash sqlite

WORKDIR /app

# Copy production artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Set up non-root user
RUN addgroup -g 1001 -S ultra-dex && \
    adduser -S ultra-dex -u 1001 && \
    mkdir -p /app/.ultra-dex && \
    chown -R ultra-dex:ultra-dex /app

USER ultra-dex

# Default entry point for Nexus Orchestration
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/cli/bin/ultra-dex.js", "serve"]

LABEL version="6.0.0" \
      description="Ultra-Dex AI Orchestration Meta-Layer"
