import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wvgkezmboewtlpnyjnyd.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2Z2tlem1ib2V3dGxwbnlqbnlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUwMjA1MiwiZXhwIjoyMDg1MDc4MDUyfQ.Il2oaNDXnynpqWUPA9g1XTPpJYA9rwxjaP9N1QdiPbc';

// Create admin client with service role key
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const TEST_ACCOUNTS = [
  {
    id: '12345678-1234-1234-1234-123456789101',
    email: 'freelancer-test@khedma.tn',
    password: 'TestPassword123!',
    role: 'freelancer',
    displayName: 'Test Freelancer',
  },
  {
    id: '12345678-1234-1234-1234-123456789102',
    email: 'client-test@khedma.tn',
    password: 'TestPassword123!',
    role: 'client',
    displayName: 'Test Client',
  },
];

async function createTestAccounts() {
  console.log('🔄 Creating test accounts in Supabase...\n');

  for (const account of TEST_ACCOUNTS) {
    try {
      // Create auth user
      console.log(`Creating ${account.role} account: ${account.email}`);
      
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: {
          name: account.displayName,
        },
      });

      if (authError) {
        console.error(`  ❌ Auth creation failed: ${authError.message}`);
        continue;
      }

      console.log(`  ✅ Auth user created: ${authData.user.id}`);

      // Create profile
      const { error: profileError } = await adminClient
        .from('profiles')
        .insert({
          id: authData.user.id,
          user_type: account.role,
          full_name: account.displayName,
          email: account.email,
          bio: `Test ${account.role} account for E2E testing`,
          preferred_language: 'ar',
          onboarding_completed: true, // Mark onboarding as complete
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error(`  ❌ Profile creation failed: ${profileError.message}`);
        continue;
      }

      console.log(`  ✅ Profile created for ${account.displayName}\n`);
    } catch (error) {
      console.error(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }
  }

  console.log('✨ Test account setup complete!');
}

createTestAccounts().catch(console.error);
