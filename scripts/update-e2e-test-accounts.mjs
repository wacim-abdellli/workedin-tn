import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wvgkezmboewtlpnyjnyd.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2Z2tlem1ib2V3dGxwbnlqbnlkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTUwMjA1MiwiZXhwIjoyMDg1MDc4MDUyfQ.Il2oaNDXnynpqWUPA9g1XTPpJYA9rwxjaP9N1QdiPbc';

// Create admin client with service role key
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const TEST_ACCOUNTS = [
  {
    email: 'freelancer-test@khedma.tn',
    role: 'freelancer',
    displayName: 'Test Freelancer',
  },
  {
    email: 'client-test@khedma.tn',
    role: 'client',
    displayName: 'Test Client',
  },
];

async function updateTestAccounts() {
  console.log('🔄 Updating test accounts to complete onboarding...\n');

  for (const account of TEST_ACCOUNTS) {
    try {
      console.log(`Updating ${account.role} account: ${account.email}`);
      
      // Find user by email
      const { data: userData, error: userError } = await adminClient
        .from('profiles')
        .select('id')
        .eq('email', account.email)
        .single();

      if (userError) {
        console.error(`  ❌ Could not find user: ${userError.message}`);
        continue;
      }

      // Update profile to mark onboarding as complete
      const { error: updateError } = await adminClient
        .from('profiles')
        .update({
          onboarding_completed: true,
          preferred_language: 'ar',
        })
        .eq('id', userData.id);

      if (updateError) {
        console.error(`  ❌ Profile update failed: ${updateError.message}`);
        continue;
      }

      console.log(`  ✅ Profile updated - onboarding marked complete\n`);
    } catch (error) {
      console.error(`  ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }
  }

  console.log('✨ Test account update complete!');
}

updateTestAccounts().catch(console.error);
