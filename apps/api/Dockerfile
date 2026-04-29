# Railway deployment for @modulajar/api
# bun image handles pnpm via corepack automatically
FROM oven/bun:1-alpine
WORKDIR /app

# Corepack activates pnpm from packageManager field
RUN corepack enable

# Copy monorepo structure
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/api ./apps/api
COPY tsconfig.base.json ./

# Install workspace deps
RUN pnpm install --frozen-lockfile

# Build API
RUN pnpm --filter @modulajar/api run build

# Railway injects env vars automatically
ENV NODE_ENV=production
EXPOSE 3000

# Run with bun directly
WORKDIR /app/apps/api
CMD ["bun", "src/index.ts"]