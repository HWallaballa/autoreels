#!/usr/bin/env bash
# =============================================================================
# AutoReels — Automated Project Setup
# Creates Supabase project, runs migrations, wires env vars.
# 
# Prerequisites:
#   - supabase CLI: npm i -g supabase
#   - GitHub account linked to Supabase (supabase login)
#   - Replicate API token
#
# Usage:
#   ./scripts/setup.sh                     # interactive (prompts for keys)
#   REPLICATE_API_TOKEN=r8_xxx ./scripts/setup.sh  # non-interactive
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env.local"
MIGRATION_FILE="$PROJECT_DIR/supabase/migrations/001_initial.sql"

echo "╔══════════════════════════════════════════╗"
echo "║    AutoReels — Project Setup             ║"
echo "╚══════════════════════════════════════════╝"

# --- Check dependencies ------------------------------------------------------
command -v node >/dev/null || { echo "❌ Node.js required"; exit 1; }
command -v npm  >/dev/null || { echo "❌ npm required"; exit 1; }

# --- Gather credentials (env vars or interactive prompts) ---------------------
if [[ -z "${NEXT_PUBLIC_SUPABASE_URL:-}" ]]; then
  echo ""
  echo "📦 Supabase Setup"
  echo "   Go to: https://supabase.com/dashboard → New Project"
  echo "   Then Settings → API Keys → Legacy tab"
  echo ""
  read -rp "  Supabase Project URL (https://xxx.supabase.co): " NEXT_PUBLIC_SUPABASE_URL
  read -rp "  Supabase Anon Key (eyJ...): " NEXT_PUBLIC_SUPABASE_ANON_KEY
  read -rp "  Supabase Service Role Key (eyJ...): " SUPABASE_SERVICE_ROLE_KEY
  read -rp "  Database Password: " SUPABASE_DB_PASSWORD
fi

if [[ -z "${REPLICATE_API_TOKEN:-}" ]]; then
  echo ""
  echo "🎬 Replicate Setup"
  echo "   Go to: https://replicate.com/account/api-tokens"
  echo ""
  read -rp "  Replicate API Token (r8_...): " REPLICATE_API_TOKEN
fi

if [[ -z "${STRIPE_SECRET_KEY:-}" ]]; then
  echo ""
  echo "💳 Stripe Setup (press Enter to skip if not ready)"
  read -rp "  Stripe Secret Key (sk_live/sk_test_...): " STRIPE_SECRET_KEY
  STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-sk_test_REPLACE_ME}"
  read -rp "  Stripe Publishable Key (pk_live/pk_test_...): " NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:-pk_test_REPLACE_ME}"
fi

# --- Extract project ref from URL --------------------------------------------
PROJECT_REF=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | grep -oP '(?<=https://)[^.]+')
echo ""
echo "📋 Project ref: $PROJECT_REF"

# --- Write .env.local ---------------------------------------------------------
echo "📝 Writing $ENV_FILE..."
cat > "$ENV_FILE" << ENVEOF
# Supabase
NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}

# Stripe
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY:-sk_test_REPLACE_ME}
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:-pk_test_REPLACE_ME}
STRIPE_WEBHOOK_SECRET=whsec_REPLACE_ME
STRIPE_PRICE_STARTER=\${STRIPE_PRICE_STARTER:-price_REPLACE_ME}
STRIPE_PRICE_PRO=\${STRIPE_PRICE_PRO:-price_REPLACE_ME}
STRIPE_PRICE_AGENCY=\${STRIPE_PRICE_AGENCY:-price_REPLACE_ME}

# Replicate (AI video generation)
REPLICATE_API_TOKEN=${REPLICATE_API_TOKEN}

# OpenAI (for TTS voiceover — optional)
OPENAI_API_KEY=\${OPENAI_API_KEY:-REPLACE_ME}

# TikTok (set up when you apply for TikTok developer access)
TIKTOK_CLIENT_KEY=\${TIKTOK_CLIENT_KEY:-REPLACE_ME}
TIKTOK_CLIENT_SECRET=\${TIKTOK_CLIENT_SECRET:-REPLACE_ME}

# App URL (update after Vercel deployment)
NEXT_PUBLIC_APP_URL=\${NEXT_PUBLIC_APP_URL:-http://localhost:3000}
ENVEOF
echo "✅ .env.local written"

# --- Run database migration ---------------------------------------------------
if [[ -f "$MIGRATION_FILE" ]]; then
  echo ""
  echo "🗄️  Running database migration..."
  
  DB_HOST="db.${PROJECT_REF}.supabase.co"
  
  if command -v psql >/dev/null 2>&1 && [[ -n "${SUPABASE_DB_PASSWORD:-}" ]]; then
    PGPASSWORD="$SUPABASE_DB_PASSWORD" psql \
      -h "$DB_HOST" -p 5432 -U postgres -d postgres \
      -f "$MIGRATION_FILE" 2>&1 && echo "✅ Migration complete" || echo "⚠️  Migration may have partially failed (tables might already exist)"
  else
    echo "⚠️  psql not available or no DB password. Run migration manually:"
    echo "   Go to: https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new"
    echo "   Paste contents of: supabase/migrations/001_initial.sql"
    echo "   Click Run"
  fi
fi

# --- Install dependencies -----------------------------------------------------
echo ""
echo "📦 Installing dependencies..."
cd "$PROJECT_DIR" && npm install 2>&1 | tail -3

# --- Build test ---------------------------------------------------------------
echo ""
echo "🔨 Testing build..."
npm run build 2>&1 | tail -5
BUILD_EXIT=$?

if [[ $BUILD_EXIT -eq 0 ]]; then
  echo ""
  echo "╔══════════════════════════════════════════╗"
  echo "║  ✅ Setup complete!                      ║"
  echo "╠══════════════════════════════════════════╣"
  echo "║  Run locally:  npm run dev               ║"
  echo "║  Deploy:       vercel --prod              ║"
  echo "╚══════════════════════════════════════════╝"
else
  echo "❌ Build failed. Check errors above."
  exit 1
fi
