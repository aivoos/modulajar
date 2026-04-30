FROM oven/bun:1-debian

WORKDIR /app

ENV PORT=8080

# Copy monorepo root
COPY ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "tsconfig.base.json", "."]

# Copy packages
COPY packages packages/

# Copy apps
COPY apps apps/

# Install deps
RUN bun install --frozen-lockfile

# Build per service (must cd into app dir since turbo runs at root)
RUN case "$RAILWAY_SERVICE_NAME" in \
      *marketing*) cd apps/marketing && bun run build ;; \
      *web*) cd apps/web && bun run build ;; \
      *) bun run --filter @modulajar/api build ;; \
    esac

EXPOSE 8080

CMD [ \
  "sh", "-c", \
  "case \"$RAILWAY_SERVICE_NAME\" in \
    *marketing*) cd apps/marketing && bun run start ;; \
    *web*) cd apps/web && bun run start ;; \
    *) bun run --filter @modulajar/api start ;; \
  esac" \
]
