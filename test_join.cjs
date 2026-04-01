const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('No supabase credentials found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testJoin() {
  const { data, error } = await supabase
    .from('milestones')
    .select(`
      id, description, due_date, amount, status, contract_id,
      contracts!inner(freelancer_id, status)
    `)
    .eq('contracts.freelancer_id', 'some-id')
    .eq('contracts.status', 'active')
    .eq('status', 'pending')
    .order('due_date', { ascending: true })
    .limit(4);
    
  console.log(error || data);
}

testJoin();
