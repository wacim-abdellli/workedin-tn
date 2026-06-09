import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    for (const line of content.split('\n')) {
      const match = line.match(/^([^#=\s]+)\s*=\s*"?([^"]*)"?\s*$/);
      if (match) {
        process.env[match[1]] = match[2].trim();
      }
    }
  } catch {
    // Ignore
  }
}

loadEnvFile(resolve(process.cwd(), '.env.local'));
loadEnvFile(resolve(process.cwd(), '.env'));

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log('Checking milestone columns...');
  const { data: milestones, error } = await supabase
    .from('milestones')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ milestones query error:', error.message);
  } else {
    console.log('✅ milestones sample structure:', milestones[0] ? Object.keys(milestones[0]) : 'no milestones found but table exists');
  }

  console.log('\nChecking contract_deliveries columns...');
  const { data: deliveries, error: delError } = await supabase
    .from('contract_deliveries')
    .select('*')
    .limit(1);

  if (delError) {
    console.error('❌ contract_deliveries query error:', delError.message);
  } else {
    console.log('✅ contract_deliveries sample structure:', deliveries[0] ? Object.keys(deliveries[0]) : 'no deliveries found but table exists');
  }
}

check().catch(console.error);
