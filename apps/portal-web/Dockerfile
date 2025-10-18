# Next.js Standalone Build for Cloud Run
FROM node:18-alpine AS base

WORKDIR /app

# Copy package.json and install dependencies
COPY package.json ./
RUN npm install

# Copy source files
COPY app/ ./app/
COPY components/ ./components/
COPY lib/ ./lib/
COPY public/ ./public/
COPY next.config.js ./
COPY postcss.config.js ./
COPY tailwind.config.js ./
COPY tsconfig.json ./

# Build the application (creates .next/standalone)
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy the standalone build
COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public

# Expose port
EXPOSE 8080

# Start the standalone server
CMD ["node", "server.js"]
