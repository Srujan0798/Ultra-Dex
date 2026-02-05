# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

FROM base AS runner
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY --from=deps /app/node_modules ./node_modules
COPY . .
USER nodejs
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 CMD node -e "require('http').get('http://localhost:3001/health',res=>process.exit(res.statusCode===200?0:1)).on('error',()=>process.exit(1))"
CMD ["node", "cli/bin/ultra-dex.js", "serve"]
