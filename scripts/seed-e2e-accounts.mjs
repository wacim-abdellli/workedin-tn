import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Load .env.local manually
function loadEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    for (const line of content.split('\n')) {
      const match = line.match(/^([^#=\s]+)\s*=\s*"?([^"]*)"?\s*$/);
      if (match) {
        process.env[match[1]] = match[2];
      }
    }
  } catch {
    // file may not exist
  }
}

loadEnvFile(resolve(process.cwd(), '.env.local'));
loadEnvFile(resolve(process.cwd(), '.env'));

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://wvgkezmboewtlpnyjnyd.supabase.co';
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ VITE_SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const TEST_ACCOUNTS = [
  {
    email: 'freelancer-test@khedma.tn',
    password: 'TestPassword123!',
    role: 'freelancer',
    displayName: 'Test Freelancer',
  },
  {
    email: 'client-test@khedma.tn',
    password: 'TestPassword123!',
    role: 'client',
    displayName: 'Test Client',
  },
];

async function createTestAccounts() {
  console.log('🔄 Creating/verifying E2E test accounts...\n');

  for (const account of TEST_ACCOUNTS) {
    console.log(`Processing ${account.role}: ${account.email}`);

    // Try to create the auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      user_metadata: { name: account.displayName },
    });

    let userId;

    if (authError) {
      if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
        console.log(`  ℹ️  Auth user already exists, fetching...`);
        // User exists, find their ID
        const { data: listData } = await adminClient.auth.admin.listUsers();
        const existing = listData?.users?.find(u => u.email === account.email);
        if (existing) {
          userId = existing.id;
          console.log(`  ✅ Found existing user: ${userId}`);
        } else {
          console.error(`  ❌ Could not find existing user`);
          continue;
        }
      } else {
        console.error(`  ❌ Auth error: ${authError.message}`);
        continue;
      }
    } else {
      userId = authData.user.id;
      console.log(`  ✅ Auth user created: ${userId}`);
    }

    // Upsert profile
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id: userId,
        user_type: account.role,
        full_name: account.displayName,
        email: account.email,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (profileError) {
      console.error(`  ❌ Profile upsert failed: ${profileError.message}`);
    } else {
      console.log(`  ✅ Profile ready for ${account.displayName}\n`);
    }
  }

  console.log('✨ E2E test accounts are ready!');
}

createTestAccounts().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
