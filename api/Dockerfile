# VÖR API Dockerfile
# Multi-stage build for production

# ========================================
# Stage 1: Dependencies
# ========================================
FROM node:22.12-alpine AS deps
WORKDIR /app

# Install dependencies needed for native modules
RUN apk add --no-cache libc6-compat openssl

# Copy package files
COPY package.json package-lock.json ./
COPY api/package.json ./api/
COPY shared/package.json ./shared/

# Install production dependencies from root workspace
RUN npm ci --omit=dev

# ========================================
# Stage 2: Builder
# ========================================
FROM node:22.12-alpine AS builder
WORKDIR /app

# Install dependencies needed for Prisma
RUN apk add --no-cache libc6-compat openssl

# Copy all package files
COPY package.json package-lock.json ./
COPY api/package.json ./api/
COPY shared/package.json ./shared/

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY api/ ./api/
COPY shared/ ./shared/

# Generate Prisma client
WORKDIR /app/api
RUN npx prisma generate

# Build the API
RUN npm run build

# ========================================
# Stage 3: Runner
# ========================================
FROM node:22.12-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 vor

# Install dependencies needed for Prisma runtime
RUN apk add --no-cache libc6-compat openssl

# Copy built application
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/api/node_modules ./api/node_modules
COPY --from=builder /app/api/dist ./api/dist
COPY --from=builder /app/api/prisma ./api/prisma
COPY --from=builder /app/api/node_modules/.prisma ./api/node_modules/.prisma
COPY --from=builder /app/api/node_modules/@prisma ./api/node_modules/@prisma
COPY api/package.json ./api/

# Set working directory
WORKDIR /app/api

# Change ownership to non-root user
RUN chown -R vor:nodejs /app

# Switch to non-root user
USER vor

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Start the application
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
