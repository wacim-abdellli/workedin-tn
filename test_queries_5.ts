import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wvgkezmboewtlpnyjnyd.supabase.co';
const supabaseKey = 'sb_publishable_Z9OkifFd7UYwCxPUFTDYJA_as4pgo9Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const r1 = await supabase.from('jobs').select('contracts(id, status, freelancer:freelancer_profiles(full_name))').limit(1);
  console.log("jobs:", r1.error);

  const r2 = await supabase.from('contracts').select('freelancer:freelancer_profiles(id, full_name, avatar_url)').limit(1);
  console.log("contracts freelancer:", r2.error);

  const r3 = await supabase.from('contracts').select('client:public_profiles(id, full_name, avatar_url)').limit(1);
  console.log("contracts client:", r3.error);

  const r4 = await supabase.from('proposals').select('freelancer:freelancer_profiles(full_name, avatar_url)').limit(1);
  console.log("proposals freelancer:", r4.error);
}
test();
