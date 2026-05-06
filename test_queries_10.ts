import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wvgkezmboewtlpnyjnyd.supabase.co';
const supabaseKey = 'sb_publishable_Z9OkifFd7UYwCxPUFTDYJA_as4pgo9Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const r1 = await supabase.from('milestones').select('id,description,due_date,amount,status,contract_id,contracts!inner(freelancer_id, status)').limit(1);
  console.log("milestones:", r1.error);
}
test();
