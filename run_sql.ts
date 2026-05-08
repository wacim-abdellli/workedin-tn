import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { error } = await supabase.rpc('execute_sql', {
    sql_string: `
      DROP POLICY IF EXISTS "contract_files_freelancer_select_own" ON storage.objects;
      CREATE POLICY "contract_files_freelancer_select_own"
      ON storage.objects FOR SELECT TO authenticated
      USING (
          bucket_id = 'contract-files'
          AND owner = auth.uid()
      );
    `
  });

  if (error) {
    console.error('Error running SQL via RPC:', error);
  } else {
    console.log('Successfully ran SQL via RPC.');
  }
}

run();
