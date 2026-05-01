# syntax=docker/dockerfile:1
# Multi-stage build: build each Next.js app, then run from pre-built .next

# ── Stage 1: Monorepo base ───────────────────────────────────────────────
FROM oven/bun:1-debian AS monorepo-base

WORKDIR /app

# Root monorepo files
COPY ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "tsconfig.base.json", "."]
COPY packages packages/
COPY apps apps/

RUN bun install --frozen-lockfile

# ── Stage 2: Build marketing ─────────────────────────────────────────────
FROM monorepo-base AS marketing-build
WORKDIR /app
# node_modules from monorepo-base (hoisted, available at /app/node_modules)
COPY --from=monorepo-base /app/node_modules ./node_modules
RUN cd apps/marketing && bun run build

# ── Stage 3: Build web ─────────────────────────────────────────────────
FROM monorepo-base AS web-build
WORKDIR /app
COPY --from=monorepo-base /app/node_modules ./node_modules
RUN cd apps/web && bun run build

# ── Stage 4: Runtime (services run from pre-built .next dirs) ──────────
FROM oven/bun:1-debian AS runtime

ENV PORT=8080

WORKDIR /app

# Copy pre-built .next + public from each build stage
COPY --from=marketing-build /app/apps/marketing/.next ./apps/marketing/.next
COPY --from=marketing-build /app/apps/marketing/public ./apps/marketing/public
COPY --from=web-build /app/apps/web/.next ./apps/web/.next
COPY --from=web-build /app/apps/web/public ./apps/web/public

# Copy monorepo source (includes package.json for scripts resolution)
COPY --from=monorepo-base /app/node_modules ./node_modules
COPY --from=monorepo-base /app/packages ./packages
COPY --from=monorepo-base /app/apps ./apps
COPY --from=monorepo-base /app/package.json ./package.json
COPY --from=monorepo-base /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=monorepo-base /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=monorepo-base /app/tsconfig.base.json ./tsconfig.base.json

EXPOSE 8080

# Run from the correct service directory so .next is found
CMD [ \
  "sh", "-c", \
  "case \"$RAILWAY_SERVICE_NAME\" in \
    *marketing*) cd apps/marketing && bun run start ;; \
    *web*) cd apps/web && bun run start ;; \
    *) bun run --filter @modulajar/api start ;; \
  esac" \
]
