# ========================================================
# Campus360 Login Module - Production Dockerfile
# Multi-stage secure build with non-root execution
# ========================================================

# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev

# Stage 2: Minimal Production Runtime
FROM node:20-alpine AS runner

WORKDIR /usr/src/app

# Security: Install dumb-init for clean PID 1 signal handling
RUN apk add --no-cache dumb-init curl

ENV NODE_ENV=production
ENV PORT=3000

# Copy node_modules from builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY package*.json ./
COPY src/ ./src/
COPY public/ ./public/
COPY database/ ./database/
COPY external-manager.js ./

# Create logs directory and assign permissions to non-root user
RUN mkdir -p logs && chown -R node:node /usr/src/app

USER node

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "src/server.js"]
