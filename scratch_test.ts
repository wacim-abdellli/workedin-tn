import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase
    .from('contracts')
    .select('id, title, status, total_amount, created_at, freelancer:public_profiles!contracts_freelancer_id_fkey(id, full_name, avatar_url)')
    .limit(1);

  console.log('Result with public_profiles:', { data, error });
  
  const { data: d2, error: e2 } = await supabase
    .from('contracts')
    .select('id, title, status, total_amount, created_at, freelancer:profiles!contracts_freelancer_id_fkey(id, full_name, avatar_url)')
    .limit(1);

  console.log('Result with profiles:', { d2, e2 });
}
test();
