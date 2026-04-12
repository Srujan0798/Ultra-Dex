# Stage 1: Install dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3: Production
FROM node:20-alpine AS runner
WORKDIR /app

# Install a lightweight static file server
RUN npm install -g serve

# Copy built assets
COPY --from=builder /app/dist ./dist

# Copy server config if it exists
COPY --from=builder /app/server.js ./server.js 2>/dev/null || true

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Serve the built assets
CMD ["serve", "-s", "dist", "-l", "3000"]
