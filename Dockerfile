FROM oven/bun:1-debian

WORKDIR /app

# Copy monorepo root
COPY ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "tsconfig.base.json", "."]

# Copy packages
COPY packages packages/

# Copy apps
COPY apps apps/

# Install deps
RUN bun install --frozen-lockfile

# Build API
WORKDIR /app/apps/api
RUN bun run build

EXPOSE 3000
CMD ["bun", "run", "start"]
