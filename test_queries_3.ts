import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wvgkezmboewtlpnyjnyd.supabase.co';
const supabaseKey = 'sb_publishable_Z9OkifFd7UYwCxPUFTDYJA_as4pgo9Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const r1 = await supabase.from('proposals').select('*, freelancer:freelancer_profiles(*)').limit(1);
  console.log("proposals freelancer_profiles relation:", r1.error);
  if (!r1.error) console.log(r1.data);

  const r2 = await supabase.from('contracts').select('*, freelancer:public_profiles!freelancer_id(*)').limit(1);
  console.log("contracts public_profiles!freelancer_id:", r2.error);
  
  const r3 = await supabase.from('contracts').select('*, client:public_profiles!client_id(*)').limit(1);
  console.log("contracts public_profiles!client_id:", r3.error);
}
test();
