import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8').split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) {
        acc[key.trim()] = value.trim();
    }
    return acc;
}, {});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const supabaseAnonKey = env['VITE_SUPABASE_ANON_KEY'];
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    const jobId = 'c72a1cc1-fd61-4a91-ae72-503ad74de93b';
    const { data, error } = await supabaseAnon
        .from('jobs')
        .select('*, client:public_profiles!jobs_client_id_fkey(id, full_name, avatar_url, location, created_at)')
        .eq('id', jobId)
        .single();
    
    console.log("DATA:", data);
    console.log("ERROR:", error);
}
test();
