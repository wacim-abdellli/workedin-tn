# Dhmad.tn Setup Script for Khedma TN (PowerShell)
# This script configures Dhmad payment integration

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectRef
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Dhmad.tn Setup Script" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host ""

$DHMAD_API_KEY = "sk_live_be6ae8b418a362ac465a25ad1f31bf05d635988f3e1374d5e40c9d2fa7d37f08"
$DHMAD_BASE_URL = "https://dhmad.tn/api/v1"
$ALLOWED_ORIGIN = "https://workedin.tn"

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "  Project Ref: $ProjectRef"
Write-Host "  API Key: $($DHMAD_API_KEY.Substring(0,20))..."
Write-Host "  Base URL: $DHMAD_BASE_URL"
Write-Host "  Allowed Origin: $ALLOWED_ORIGIN"
Write-Host ""

# Step 1: Set secrets
Write-Host "🔐 Step 1: Setting Supabase secrets..." -ForegroundColor Yellow
npx supabase secrets set "DHMAD_API_KEY=$DHMAD_API_KEY" --project-ref $ProjectRef
npx supabase secrets set "DHMAD_BASE_URL=$DHMAD_BASE_URL" --project-ref $ProjectRef
npx supabase secrets set "ALLOWED_ORIGIN=$ALLOWED_ORIGIN" --project-ref $ProjectRef
Write-Host "✅ Secrets set successfully" -ForegroundColor Green
Write-Host ""

# Step 2: Deploy Edge Functions
Write-Host "🚀 Step 2: Deploying Edge Functions..." -ForegroundColor Yellow
npx supabase functions deploy dhmad-create-escrow --project-ref $ProjectRef
npx supabase functions deploy dhmad-release-escrow --project-ref $ProjectRef
npx supabase functions deploy dhmad-refund-escrow --project-ref $ProjectRef
npx supabase functions deploy dhmad-get-escrow-status --project-ref $ProjectRef
npx supabase functions deploy dhmad-checkout-session --project-ref $ProjectRef
Write-Host "✅ Edge Functions deployed successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Verify secrets
Write-Host "🔍 Step 3: Verifying secrets..." -ForegroundColor Yellow
npx supabase secrets list --project-ref $ProjectRef
Write-Host ""

Write-Host "✅ Dhmad.tn setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Test in development: npm run dev"
Write-Host "  2. Create a test contract"
Write-Host "  3. Monitor logs: npx supabase functions logs dhmad-create-escrow --project-ref $ProjectRef"
Write-Host ""
Write-Host "📚 Documentation: See DHMAD_SETUP_GUIDE.md for more details" -ForegroundColor Cyan
