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
    // Ignore error
  }
}

loadEnvFile(resolve(process.cwd(), '.env.local'));
loadEnvFile(resolve(process.cwd(), '.env'));

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ VITE_SUPABASE_SERVICE_ROLE_KEY not found');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkSchema() {
  console.log('Checking if contract_delivery_links table exists...');
  const { data: linkData, error: linkError } = await supabase
    .from('contract_delivery_links')
    .select('*')
    .limit(1);

  if (linkError) {
    console.log('❌ contract_delivery_links table error:', linkError.message);
  } else {
    console.log('✅ contract_delivery_links table exists! Sample data:', linkData);
  }

  console.log('\nChecking contract columns by fetching a single contract...');
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (contractError) {
    console.error('❌ Error fetching contract:', contractError.message);
  } else if (!contract) {
    console.log('❓ No contracts found in database.');
  } else {
    console.log('✅ Contract fetched! Columns:');
    Object.keys(contract).forEach(col => {
      console.log(`  - ${col}: ${contract[col]}`);
    });
  }
}

checkSchema().catch(console.error);
