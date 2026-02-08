# Ultra-Dex Production Dockerfile
# Multi-stage build for optimal size and security

# Build stage
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with production flag
RUN npm ci --only=production

# Runtime stage
FROM node:18-alpine AS runtime

# Install runtime dependencies
RUN apk add --no-cache \
    dumb-init \
    tini \
    curl \
    bash \
    git

# Create non-root user for security
RUN addgroup -g 1001 -S ultra-dex && \
    adduser -S ultra-dex -u 1001

WORKDIR /app

# Copy built application
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Create necessary directories
RUN mkdir -p /app/.ultra-dex /app/workspace && \
    chown -R ultra-dex:ultra-dex /app

# Switch to non-root user
USER ultra-dex

# Expose MCP server port
EXPOSE 8866

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8866/health || exit 1

# Use tini to handle signals properly
ENTRYPOINT ["tini", "--"]

# Default command
CMD ["node", "cli/bin/ultra-dex.js", "serve"]

# Labels for container metadata
LABEL name="ultra-dex" \
      version="4.3.0" \
      maintainer="Srujan Sai Karna" \
      description="AI Orchestration Meta-Layer for SaaS Development" \
      homepage="https://github.com/Srujan0798/Ultra-Dex" \
      repository="https://github.com/Srujan0798/Ultra-Dex" \
      license="MIT"

# Build arguments
ARG BUILD_DATE
ARG VERSION
LABEL build_date="${BUILD_DATE}" \
      version="${VERSION}"

# Documentation
# 
# Build the image:
#   docker build -t ultra-dex:latest .
#
# Run the container:
#   docker run -d --name ultra-dex \
#     -p 8866:8866 \
#     -v $(pwd)/workspace:/app/workspace \
#     -e OPENAI_API_KEY=your-key \
#     ultra-dex:latest
#
# Run with docker-compose:
#   docker-compose up -d
#
# Environment variables:
#   - OPENAI_API_KEY: OpenAI API key
#   - ANTHROPIC_API_KEY: Anthropic API key
#   - GOOGLE_API_KEY: Google API key
#   - NODE_ENV: production/development
#   - PORT: MCP server port (default: 8866)