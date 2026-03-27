// ============================================
// BROWSER CONSOLE TEST SCRIPT
// Copy and paste this into your browser console (F12)
// ============================================

console.log('🔍 Starting Admin Dashboard Diagnostic...\n');

async function runDiagnostic() {
    try {
        // Test 1: Check if supabase client exists
        if (!window.supabase) {
            console.error('❌ window.supabase is not defined!');
            return;
        }
        console.log('✅ Supabase client found\n');

        // Test 2: Get current user
        console.log('📋 Test 2: Getting current user...');
        const { data: { user }, error: userError } = await window.supabase.auth.getUser();
        
        if (userError) {
            console.error('❌ Error getting user:', userError);
            return;
        }
        
        if (!user) {
            console.error('❌ No user logged in!');
            console.log('👉 Please log in first');
            return;
        }
        
        console.log('✅ Logged in as:', user.email);
        console.log('   User ID:', user.id);
        console.log('');

        // Test 3: Get profile
        console.log('📋 Test 3: Getting profile...');
        const { data: profile, error: profileError } = await window.supabase
            .from('profiles')
            .select('id, email, full_name, is_admin')
            .eq('id', user.id)
            .single();
        
        if (profileError) {
            console.error('❌ Error getting profile:', profileError);
            return;
        }
        
        console.log('✅ Profile found:', profile);
        console.log('   is_admin:', profile.is_admin);
        console.log('');

        if (!profile.is_admin) {
            console.error('❌ You are NOT an admin!');
            console.log('👉 Run this SQL in Supabase SQL Editor:');
            console.log(`   UPDATE profiles SET is_admin = true WHERE email = '${user.email}';`);
            return;
        }

        // Test 4: Try to count profiles
        console.log('📋 Test 4: Counting profiles...');
        const { count: profilesCount, error: countError1 } = await window.supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true });
        
        if (countError1) {
            console.error('❌ Error counting profiles:', countError1);
            console.log('👉 This means RLS policies are blocking you!');
            console.log('👉 Run NUCLEAR_FIX.sql in Supabase SQL Editor');
            return;
        }
        
        console.log('✅ Can count profiles:', profilesCount);
        console.log('');

        // Test 5: Try to count jobs
        console.log('📋 Test 5: Counting jobs...');
        const { count: jobsCount, error: countError2 } = await window.supabase
            .from('jobs')
            .select('id', { count: 'exact', head: true });
        
        if (countError2) {
            console.error('❌ Error counting jobs:', countError2);
            return;
        }
        
        console.log('✅ Can count jobs:', jobsCount);
        console.log('');

        // Test 6: Try to count contracts
        console.log('📋 Test 6: Counting contracts...');
        const { count: contractsCount, error: countError3 } = await window.supabase
            .from('contracts')
            .select('id', { count: 'exact', head: true });
        
        if (countError3) {
            console.error('❌ Error counting contracts:', countError3);
            return;
        }
        
        console.log('✅ Can count contracts:', contractsCount);
        console.log('');

        // Final verdict
        console.log('═══════════════════════════════════════');
        console.log('🎉 ALL TESTS PASSED!');
        console.log('═══════════════════════════════════════');
        console.log('Your admin dashboard should work now.');
        console.log('If it still shows zeros, refresh the page.');
        console.log('');
        console.log('Summary:');
        console.log('  • User:', user.email);
        console.log('  • Admin:', profile.is_admin ? 'YES ✅' : 'NO ❌');
        console.log('  • Profiles:', profilesCount);
        console.log('  • Jobs:', jobsCount);
        console.log('  • Contracts:', contractsCount);
        console.log('═══════════════════════════════════════');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

// Run the diagnostic
runDiagnostic();
