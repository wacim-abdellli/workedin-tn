const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read env variables from .env.local
const envLocalPath = 'c:/Users/pc/Desktop/workedin_tn/.env.local';
const envContent = fs.readFileSync(envLocalPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    envVars[match[1]] = value;
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_SERVICE_ROLE_KEY;

console.log('Target URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.rpc('approve_withdrawal_admin', {
    p_withdrawal_id: '00000000-0000-0000-0000-000000000000',
    p_admin_notes: 'Checking existence'
  });
  console.log('RPC check result:');
  if (error) {
    console.log('Error Code:', error.code);
    console.log('Error Message:', error.message);
  } else {
    console.log('Data:', data);
  }
}

check();
