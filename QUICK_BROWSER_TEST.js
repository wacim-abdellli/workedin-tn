// Quick test - paste this in console
(async () => {
    console.log('=== QUICK ADMIN TEST ===');
    
    // Check user
    const { data: { user } } = await window.supabase.auth.getUser();
    console.log('1. User:', user?.email, user?.id);
    
    // Check profile
    const { data: profile, error: pErr } = await window.supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
    console.log('2. Profile:', profile, 'Error:', pErr);
    
    // Try to count
    const { count, error: cErr } = await window.supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });
    console.log('3. Count:', count, 'Error:', cErr);
    
    console.log('=== END TEST ===');
})();
