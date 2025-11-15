# Simple build for portal-api (standalone)
FROM node:18-alpine AS base

# Install OpenSSL and other dependencies for Prisma
RUN apk add --no-cache openssl libc6-compat

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY src/ ./src/
COPY tsconfig.json tsconfig.build.json nest-cli.json ./

# Copy Prisma schema
COPY prisma/schema.prisma ./prisma/schema.prisma

# Generate Prisma client and build (use build:docker script)
RUN pnpm run build:docker

# Production stage  
FROM node:18-alpine AS production

# Install OpenSSL for Prisma in production stage
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy built application and dependencies
COPY --from=base /app/dist ./dist
COPY --from=base /app/package.json ./
COPY --from=base /app/node_modules ./node_modules

# Expose port
EXPOSE 8080

# Start the application
CMD ["node", "dist/main.js"]
