#!/bin/bash

# Dhmad.tn Setup Script for Khedma TN
# This script configures Dhmad payment integration

set -e

echo "🚀 Dhmad.tn Setup Script"
echo "========================"
echo ""

# Check if project ref is provided
if [ -z "$1" ]; then
    echo "❌ Error: Supabase project reference required"
    echo ""
    echo "Usage: ./scripts/setup-dhmad.sh YOUR_PROJECT_REF"
    echo ""
    echo "Find your project ref:"
    echo "  1. From dashboard URL: https://supabase.com/dashboard/project/YOUR_PROJECT_REF"
    echo "  2. From VITE_SUPABASE_URL: https://YOUR_PROJECT_REF.supabase.co"
    echo ""
    exit 1
fi

PROJECT_REF=$1
DHMAD_API_KEY="sk_live_be6ae8b418a362ac465a25ad1f31bf05d635988f3e1374d5e40c9d2fa7d37f08"
DHMAD_BASE_URL="https://dhmad.tn/api/v1"
ALLOWED_ORIGIN="https://workedin.tn"

echo "📋 Configuration:"
echo "  Project Ref: $PROJECT_REF"
echo "  API Key: ${DHMAD_API_KEY:0:20}..."
echo "  Base URL: $DHMAD_BASE_URL"
echo "  Allowed Origin: $ALLOWED_ORIGIN"
echo ""

# Step 1: Set secrets
echo "🔐 Step 1: Setting Supabase secrets..."
npx supabase secrets set DHMAD_API_KEY="$DHMAD_API_KEY" --project-ref "$PROJECT_REF"
npx supabase secrets set DHMAD_BASE_URL="$DHMAD_BASE_URL" --project-ref "$PROJECT_REF"
npx supabase secrets set ALLOWED_ORIGIN="$ALLOWED_ORIGIN" --project-ref "$PROJECT_REF"
echo "✅ Secrets set successfully"
echo ""

# Step 2: Deploy Edge Functions
echo "🚀 Step 2: Deploying Edge Functions..."
npx supabase functions deploy dhmad-create-escrow --project-ref "$PROJECT_REF"
npx supabase functions deploy dhmad-release-escrow --project-ref "$PROJECT_REF"
npx supabase functions deploy dhmad-refund-escrow --project-ref "$PROJECT_REF"
npx supabase functions deploy dhmad-get-escrow-status --project-ref "$PROJECT_REF"
npx supabase functions deploy dhmad-checkout-session --project-ref "$PROJECT_REF"
echo "✅ Edge Functions deployed successfully"
echo ""

# Step 3: Verify secrets
echo "🔍 Step 3: Verifying secrets..."
npx supabase secrets list --project-ref "$PROJECT_REF"
echo ""

echo "✅ Dhmad.tn setup complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Test in development: npm run dev"
echo "  2. Create a test contract"
echo "  3. Monitor logs: npx supabase functions logs dhmad-create-escrow --project-ref $PROJECT_REF"
echo ""
echo "📚 Documentation: See DHMAD_SETUP_GUIDE.md for more details"
