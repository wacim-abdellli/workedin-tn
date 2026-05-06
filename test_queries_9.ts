import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wvgkezmboewtlpnyjnyd.supabase.co';
const supabaseKey = 'sb_publishable_Z9OkifFd7UYwCxPUFTDYJA_as4pgo9Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data } = await supabase.from('contracts').select('*');
  console.log("All contracts:", data?.length);
  if (data?.length) {
     console.log("First contract:", data[0]);
  }
}
test();
