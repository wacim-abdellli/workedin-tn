
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';

const env = dotenv.parse(readFileSync('.env'));
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function test() {
  console.log('Testing getting conversations...');
  const { data, error } = await supabase.from('conversations').select('*').limit(1);
  console.log('Conversations:', data, error);

  console.log('Testing getting messages...');
  const { data: mData, error: mError } = await supabase
        .from('messages')
        .select('*,sender:profiles!sender_id(id, full_name, avatar_url)')
        .limit(1);
  console.log('Messages:', mData, mError);
}
test();
