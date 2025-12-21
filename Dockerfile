# Use official Bun image
FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

# Build stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Prisma generate needs DATABASE_URL but doesn't actually connect during generate
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN bunx prisma generate

# Production stage
FROM base AS runner
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/package.json ./
COPY --from=builder /app/docker-entrypoint.sh ./

# Make entrypoint executable
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["bun", "src/server.js"]


