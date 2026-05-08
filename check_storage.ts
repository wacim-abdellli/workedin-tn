import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
// Need service role key to bypass RLS for this check!
// Actually, let's just use the REST API to see the columns, or try inserting!

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.storage.from('contract-files').list();
  console.log('List error:', error);
}

run();
