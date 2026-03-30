require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkFreelancers() {
    console.log('Checking profiles with user_type in (freelancer, both)...');
    const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, full_name, user_type')
        .in('user_type', ['freelancer', 'both']);
        
    console.log('Profiles error:', pErr);
    console.log(`Found ${profiles?.length || 0} matching profiles.`);
    
    if (profiles && profiles.length > 0) {
        console.log('First profile:', profiles[0].full_name, 'ID:', profiles[0].id);
        
        console.log('\nChecking if they have a freelancer_profile entry...');
        const { data: fps, error: fpErr } = await supabase
            .from('freelancer_profiles')
            .select('id, title')
            .in('id', profiles.map(p => p.id));
            
        console.log('Freelancer profiles error:', fpErr);
        console.log(`Found ${fps?.length || 0} matching freelancer_profiles.`);
    }

    console.log('\nRunning the exact query from the app:');
    const { data: exact, error: exactErr } = await supabase
        .from('profiles')
        .select(`
            id,
            full_name,
            user_type,
            freelancer_profiles!inner (
                id,
                title
            )
        `)
        .in('user_type', ['freelancer', 'both']);
        
    console.log('Exact query error:', exactErr);
    console.log(`Exact query returned ${exact?.length || 0} results.`);
}

checkFreelancers();
