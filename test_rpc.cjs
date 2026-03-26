const fs = require('fs');
const envContent = fs.readFileSync('.env', 'utf8');
const envConfig = {};
envContent.split(/\r?\n/).forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/['"]/g, '');
    envConfig[key] = val;
  }
});
const url = envConfig.VITE_SUPABASE_URL + '/rest/v1/rpc/set_user_type_rpc';
const key = envConfig.VITE_SUPABASE_ANON_KEY;

console.log('Testing RPC manually with raw fetch...');
console.log('Target URL:', url);

async function test() {
  const startObj = Date.now();
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);
    
    console.log('Signing in anonymously or with test dummy...');
    // We will just sign up a random dummy user to get an authenticated session!
    const dummyEmail = 'test_rpc_' + Date.now() + '@yopmail.com';
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: dummyEmail,
      password: 'password123456'
    });
    
    if (authError) throw authError;
    console.log('Signed up as', dummyEmail);

    console.log('Invoking RPC...');
    const rpcStart = Date.now();
    const { data, error } = await supabase.rpc('set_user_type_rpc', {
      p_user_type: 'freelancer',
      p_active_mode: 'freelancer'
    });

    console.log('RPC took:', Date.now() - rpcStart, 'ms');
    if (error) console.log('RPC Error:', error);
    else console.log('RPC Success:', data);

  } catch(e) {
    console.log('Fetch exception:', e);
  }
}

test().then(() => process.exit(0));
