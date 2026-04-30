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

# Build per service
RUN case "$RAILWAY_SERVICE_NAME" in \
      *marketing*) bun run --filter @modulajar/marketing build ;; \
      *web*) bun run --filter @modulajar/web build ;; \
      *) bun run --filter @modulajar/api build ;; \
    esac

EXPOSE 3000
CMD [ \
  "sh", "-c", \
  "case \"$RAILWAY_SERVICE_NAME\" in \
    *marketing*) bun run --filter @modulajar/marketing start ;; \
    *web*) bun run --filter @modulajar/web start ;; \
    *) bun run --filter @modulajar/api start ;; \
  esac" \
]
