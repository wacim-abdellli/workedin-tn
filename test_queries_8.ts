import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wvgkezmboewtlpnyjnyd.supabase.co';
const supabaseKey = 'sb_publishable_Z9OkifFd7UYwCxPUFTDYJA_as4pgo9Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const r1 = await supabase.from('contracts').select('client:public_profiles!contracts_client_id_fkey(id, full_name, avatar_url)').limit(1);
  console.log("with hint:", r1.error);
  
  const r2 = await supabase.from('contracts').select('client:public_profiles(id, full_name, avatar_url)').limit(1);
  console.log("without hint:", r2.error);
}
test();
