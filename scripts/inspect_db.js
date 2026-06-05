import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Load .env.local manually
function loadEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    for (const line of content.split('\n')) {
      const match = line.match(/^([^#=\s]+)\s*=\s*"?([^"]*)"?\s*$/);
      if (match) {
        process.env[match[1]] = match[2];
      }
    }
  } catch {
    // file may not exist
  }
}

// Load env from project root
const projectRoot = '.';
loadEnvFile(resolve(projectRoot, '.env.local'));
loadEnvFile(resolve(projectRoot, '.env'));

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://wvgkezmboewtlpnyjnyd.supabase.co';
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SERVICE_ROLE_KEY not found');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function inspect() {
  console.log('Inspecting Database...');

  // 1. Get profile count and some samples
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, full_name, email, user_type')
    .limit(10);
  
  if (pError) console.error('Error fetching profiles:', pError);
  else console.log('\n--- Profiles Samples ---', profiles);

  // 2. Get auth users list
  const { data: authUsers, error: aError } = await supabase.auth.admin.listUsers();
  if (aError) console.error('Error fetching auth users:', aError);
  else {
    console.log('\n--- Auth Users ---');
    authUsers.users.forEach(u => {
      console.log(`- ID: ${u.id}, Email: ${u.email}, Metadata:`, u.user_metadata);
    });
  }
}

inspect().catch(console.error);
