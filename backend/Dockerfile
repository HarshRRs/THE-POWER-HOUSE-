# Build stage
FROM node:22-slim AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Prune dev dependencies
RUN npm prune --production

# Production stage
FROM node:22-slim AS runner

WORKDIR /app

# Install runtime dependencies for Playwright + curl for health checks
RUN apt-get update && apt-get install -y \
    openssl \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Create screenshots directory
RUN mkdir -p public/screenshots

# Install Playwright browsers and their system dependencies
RUN npx playwright install --with-deps chromium

# Set environment
ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

# Start command
CMD ["node", "dist/index.js"]
