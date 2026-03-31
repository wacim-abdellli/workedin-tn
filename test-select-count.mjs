import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    const { data, error } = await supabase
        .from('conversations')
        .select(`
            id,
            messages(count)
        `)
        .limit(2);
    
    console.log(JSON.stringify({ data, error }, null, 2));
}

check();