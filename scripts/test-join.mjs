// Deprecated script: historical debug helper, not a canonical entrypoint.
// Use package.json scripts and scripts/README.md instead.

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
    const { data, error } = await supabase.from('profiles').select('id, user_type, freelancer_profiles!inner(title)').limit(1);
    console.log(error);
    console.log(JSON.stringify(data, null, 2));
}

test();
