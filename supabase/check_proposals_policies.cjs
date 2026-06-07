const { createClient } = require('@supabase/supabase-js');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

function loadEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    for (const line of content.split('\n')) {
      const match = line.trim().match(/^([^#=\s]+)\s*=\s*"?([^"\r\n]*)"?\s*$/);
      if (match) {
        process.env[match[1]] = match[2];
      }
    }
  } catch {}
}

loadEnvFile(resolve('.', '.env.local'));
loadEnvFile(resolve('.', '.env'));

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://wvgkezmboewtlpnyjnyd.supabase.co';
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function run() {
  console.log('Querying pg_policies for tablename = proposals via exec_sql...');
  const sql = "SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check FROM pg_policies WHERE tablename = 'proposals'";
  const { data, error } = await supabase.rpc('exec_sql', { query: sql });

  if (error) {
    console.error('exec_sql error:', error);
    return;
  }
  console.log('Active Policies on proposals:');
  console.log(JSON.stringify(data, null, 2));
}

run().catch(console.error);
