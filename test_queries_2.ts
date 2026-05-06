import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wvgkezmboewtlpnyjnyd.supabase.co';
const supabaseKey = 'sb_publishable_Z9OkifFd7UYwCxPUFTDYJA_as4pgo9Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const r1 = await supabase.from('proposals').select('*, freelancer:public_profiles(*)').limit(1);
  console.log("public_profiles relation:", r1.error);

  const r2 = await supabase.from('proposals').select('*, freelancer:profiles(*)').limit(1);
  console.log("profiles relation:", r2.error);

  const r3 = await supabase.from('contracts').select('*, freelancer:public_profiles(*)').limit(1);
  console.log("contracts public_profiles relation:", r3.error);

  const r4 = await supabase.from('contracts').select('*, freelancer:profiles(*)').limit(1);
  console.log("contracts profiles relation:", r4.error);
}
test();
