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
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_user_type: 'freelancer', p_active_mode: 'freelancer' })
    });
    const text = await res.text();
    console.log('Response took:', Date.now() - startObj, 'ms, Status:', res.status, 'Body:', text);
  } catch(e) {
    console.log('Fetch exception:', e.message);
  }
}

test().then(() => process.exit(0));
