import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wvgkezmboewtlpnyjnyd.supabase.co';
const supabaseKey = 'sb_publishable_Z9OkifFd7UYwCxPUFTDYJA_as4pgo9Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const r1 = await supabase.from('proposals').select('id, freelancer_id, freelancer:freelancer_profiles(id, public_profiles(full_name, avatar_url))').limit(1);
  console.log("nested proposals:", JSON.stringify(r1, null, 2));
}
test();
