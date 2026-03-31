const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1];
const anonKey = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1];
const supabase = createClient(url, anonKey);
async function testQuery() {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email: 'admin@khedma.tn', password: 'password123' });
  if (authError) { console.error('Auth error', authError); return; }
  const userId = authData.user.id;
  console.time('Get Conversations (RLS Active)');
  const { data, error } = await supabase.from('conversations').select('*').or('participant_1.eq.' + userId + ',participant_2.eq.' + userId).order('last_message_at', { ascending: false });
  console.timeEnd('Get Conversations (RLS Active)');
  console.log('Conversations count:', data ? data.length : 0);
  console.log('Conversations error:', error);
}
testQuery();
