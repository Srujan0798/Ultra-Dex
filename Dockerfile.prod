# Ultra-Dex v3.0.0 Production Dockerfile
# Multi-stage build for optimized production image

# Stage 1: Build
FROM node:22-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci --include=dev

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production
FROM node:22-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S ultra-dex -u 1001 -G nodejs

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production --no-audit && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=ultra-dex:nodejs /app/dist ./dist
COPY --from=builder --chown=ultra-dex:nodejs /app/src ./src
COPY --from=builder --chown=ultra-dex:nodejs /app/apps ./apps

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV NODE_OPTIONS="--max-old-space-size=512"

# Use non-root user
USER ultra-dex

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Start the application
CMD ["node", "dist/ultra-dex.js"]

# Build instructions:
# docker build -f Dockerfile.prod -t ultra-dex:v3.0.0 .
#
# Run instructions:
# docker run -p 3000:3000 \
#   -e OPENAI_API_KEY=your_key \
#   -e ANTHROPIC_API_KEY=your_key \
#   -e REDIS_URL=redis://redis:6379 \
#   ultra-dex:v3.0.0
#
# Required environment variables:
# - OPENAI_API_KEY: OpenAI API key
# - ANTHROPIC_API_KEY: Anthropic API key  
# - REDIS_URL: Redis connection URL (for mesh bus)
# - DATABASE_URL: Database connection (optional)