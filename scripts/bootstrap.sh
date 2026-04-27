#!/bin/bash
# Bootstrap a fresh pnpm monorepo install
set -e

echo "📦 Installing dependencies..."
pnpm install

echo "✅ Done. Next steps:"
echo "   cp .env.example .env.local  # fill in your values"
echo "   pnpm dev                   # start dev server"
echo "   pnpm typecheck             # type check all packages"
