# Ultra-Dex Docker Image
# Multi-stage build for optimized production image

# ============================================================================
# Stage 1: Dependencies
# ============================================================================
FROM node:20-alpine AS deps

RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./

# Install dependencies with legacy peer deps (required for this project)
RUN npm ci --legacy-peer-deps

# ============================================================================
# Stage 2: Builder
# ============================================================================
FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build CLI bundle
RUN npx esbuild apps/cli/bin/ultra-dex.js \
    --bundle \
    --platform=node \
    --outfile=dist/ultra-dex.js \
    --format=esm \
    --external:node-pty \
    --external:puppeteer \
    --external:sharp \
    --external:keytar \
    --external:sqlite3 \
    --external:playwright \
    --external:libsodium-wrappers \
    --external:ink \
    --external:ink-spinner \
    --external:@modelcontextprotocol/sdk \
    --external:neo4j-driver

# ============================================================================
# Stage 3: Production
# ============================================================================
FROM node:20-alpine AS production

LABEL org.opencontainers.image.title="Ultra-Dex"
LABEL org.opencontainers.image.description="The AI Orchestration Meta-Layer for SaaS Development"
LABEL org.opencontainers.image.source="https://github.com/Srujan0798/Ultra-Dex"

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache git openssh-client

# Copy package files
COPY package.json package-lock.json ./

# Reuse built dependencies from builder stage to avoid native rebuild issues.
COPY --from=builder /app/node_modules ./node_modules

# Copy bundled CLI
COPY --from=builder /app/dist/ultra-dex.js ./dist/ultra-dex.js

# Copy entry point
COPY apps/cli/bin/ultra-dex.js ./bin/ultra-dex.js

# Create runtime directories
RUN mkdir -p /app/.ultra-dex/logs /app/.ultra-dex/runs

# Set environment variables
ENV NODE_ENV=production
ENV FORCE_COLOR=3

# Expose ports for dashboard and API
EXPOSE 3000 3001 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node bin/ultra-dex.js --version || exit 1

# Entry point
ENTRYPOINT ["node", "bin/ultra-dex.js"]
CMD ["--help"]
