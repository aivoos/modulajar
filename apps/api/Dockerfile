# Build from monorepo root so workspace:* deps resolve
# Railway will use this Dockerfile for @modulajar/api
FROM node:20-alpine
WORKDIR /app

# Copy monorepo config
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/api/package.json ./apps/api/

# Install all workspace deps (resolves workspace:*)
RUN npm install -g pnpm@9 && \
    pnpm install --frozen-lockfile

# Copy API source
COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json ./apps/api/
COPY tsconfig.base.json ./

# Build API with pnpm (monorepo-aware)
RUN pnpm --filter @modulajar/api run build

EXPOSE 3000
WORKDIR /app/apps/api
CMD ["node", "dist/index.js"]
