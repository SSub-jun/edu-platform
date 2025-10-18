# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/

# Install pnpm
RUN npm install -g pnpm@9.0.0

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY packages/db ./packages/db
COPY apps/api ./apps/api

# Generate Prisma Client
RUN cd packages/db && npx prisma generate

# Build API
RUN cd apps/api && pnpm build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/

# Install pnpm
RUN npm install -g pnpm@9.0.0

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Copy Prisma schema and generate client
COPY packages/db/prisma ./packages/db/prisma
RUN cd packages/db && npx prisma generate

# Copy built application from builder
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/uploads ./apps/api/uploads

# Expose port
EXPOSE 4000

# Start application
CMD ["node", "apps/api/dist/main"]

