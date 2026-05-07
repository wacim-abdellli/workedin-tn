import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wvgkezmboewtlpnyjnyd.supabase.co';
const supabaseKey = 'sb_publishable_Z9OkifFd7UYwCxPUFTDYJA_as4pgo9Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const r1 = await supabase.from('notifications').select('id, user_id, type, title, body, link').order('created_at', { ascending: false }).limit(10);
  console.log("notifications:", JSON.stringify(r1.data, null, 2));
}
test();
