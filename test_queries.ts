import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wvgkezmboewtlpnyjnyd.supabase.co';
const supabaseKey = 'sb_publishable_Z9OkifFd7UYwCxPUFTDYJA_as4pgo9Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Running jobs query...");
  const jobsRes = await supabase
    .from('jobs')
    .select(`
        id, title, budget_min, budget_max, status, created_at,
        proposals_count,
        contracts(id, status, freelancer:profiles!contracts_freelancer_id_fkey(full_name))
    `)
    .limit(1);
  console.log("jobsRes Error:", jobsRes.error);
  if (!jobsRes.error) console.log("jobsRes Data OK");

  console.log("Running proposals query...");
  const proposalsRes = await supabase
    .from('proposals')
    .select('id, job_id, bid_amount, created_at, job:jobs!inner(title, client_id), freelancer:public_profiles!proposals_freelancer_id_fkey(full_name, avatar_url)')
    .limit(1);
  console.log("proposalsRes Error:", proposalsRes.error);
  if (!proposalsRes.error) console.log("proposalsRes Data OK");

  const proposalsRes2 = await supabase
    .from('proposals')
    .select('id, job_id, bid_amount, created_at, job:jobs!inner(title, client_id), freelancer:profiles!proposals_freelancer_id_fkey(full_name, avatar_url)')
    .limit(1);
  console.log("proposalsRes2 Error (using profiles):", proposalsRes2.error);
  if (!proposalsRes2.error) console.log("proposalsRes2 Data OK");

  console.log("Running activeContracts query...");
  const activeContractsRes = await supabase
    .from('contracts')
    .select('id, title, status, total_amount, created_at, freelancer:profiles!contracts_freelancer_id_fkey(id, full_name, avatar_url)')
    .limit(1);
  console.log("activeContractsRes Error:", activeContractsRes.error);
  if (!activeContractsRes.error) console.log("activeContractsRes Data OK");
}
test();
