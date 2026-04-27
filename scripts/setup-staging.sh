#!/usr/bin/env bash
# Setup staging Supabase project
# Run once to configure a staging Supabase project for CI regression tests
set -e

echo "📦 Setting up Modulajar staging environment..."

# Check Supabase CLI
if ! command -v supabase &> /dev/null; then
  echo "❌ Supabase CLI not found. Install: https://github.com/supabase/cli"
  exit 1
fi

# Create staging project (if not exists)
echo "1. Creating staging Supabase project..."
echo "   → Go to https://supabase.com/dashboard → New Project → 'modulajar-staging'"
echo "   → Save the: Project ID, Database Password, API URL"
echo ""
read -p "Staging Project ID: " PROJECT_ID
read -p "Staging DB Password: " DB_PASSWORD

# Link local project to staging
echo ""
echo "2. Linking to staging project..."
supabase link --project-ref "$PROJECT_ID"

# Push migrations
echo ""
echo "3. Pushing migrations to staging..."
supabase db push --project-id "$PROJECT_ID"

# Get API URL
API_URL=$(supabase status --project-id "$PROJECT_ID" 2>/dev/null | grep "API URL" | awk '{print $3}')
echo ""
echo "✅ Staging setup complete!"
echo ""
echo "📋 GitHub Secrets for staging:"
echo "   SUPABASE_STAGING_PROJECT_ID=$PROJECT_ID"
echo "   SUPABASE_STAGING_DB_PASSWORD=$DB_PASSWORD"
echo ""
echo "🧪 Run regression tests:"
echo "   pnpm test:staging"
