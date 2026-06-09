import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import crypto from 'node:crypto';

// Load environment variables
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
    // Ignore errors
  }
}

loadEnvFile(resolve(process.cwd(), '.env.local'));
loadEnvFile(resolve(process.cwd(), '.env'));

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SERVICE_ROLE_KEY || !ANON_KEY || !SUPABASE_URL) {
  console.error('❌ Missing environment configuration keys.');
  process.exit(1);
}

// Initialize clients
const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const clientSupabase = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false }
});

const freelancerSupabase = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false }
});

const clientEmail = `test_client_m_${crypto.randomUUID().slice(0, 8)}@workedin-test.tn`;
const freelancerEmail = `test_freelancer_m_${crypto.randomUUID().slice(0, 8)}@workedin-test.tn`;
const testPassword = 'SecurePassword123!';

async function runMilestoneSimulation() {
  console.log('🚀 INITIALIZING E2E MULTI-MILESTONE LIFECYCLE SIMULATION\n');

  let clientUser, freelancerUser;
  let contractId, jobId;
  let milestone1Id, milestone2Id;

  async function upsertProfile(userId, data) {
    const { data: existing } = await adminSupabase.from('profiles').select('id').eq('id', userId).maybeSingle();
    if (existing) {
      const { error } = await adminSupabase.from('profiles').update(data).eq('id', userId);
      if (error) throw error;
    } else {
      const { error } = await adminSupabase.from('profiles').insert({ id: userId, ...data });
      if (error) throw error;
    }
  }

  async function upsertFreelancerProfile(userId, data) {
    const { data: existing } = await adminSupabase.from('freelancer_profiles').select('id').eq('id', userId).maybeSingle();
    if (existing) {
      const { error } = await adminSupabase.from('freelancer_profiles').update(data).eq('id', userId);
      if (error) throw error;
    } else {
      const { error } = await adminSupabase.from('freelancer_profiles').insert({ id: userId, ...data });
      if (error) throw error;
    }
  }

  async function upsertWallet(userId, balance) {
    const { data: existing } = await adminSupabase.from('wallets').select('id, user_id').eq('user_id', userId).maybeSingle();
    if (existing) {
      const { error } = await adminSupabase.from('wallets').update({ balance }).eq('user_id', userId);
      if (error) throw error;
    } else {
      const { error } = await adminSupabase.from('wallets').insert({ user_id: userId, balance });
      if (error) throw error;
    }
  }

  try {
    // 1. Create client and freelancer auth users
    console.log('👥 Creating mock users...');
    const { data: cUser, error: cError } = await adminSupabase.auth.admin.createUser({
      email: clientEmail,
      password: testPassword,
      email_confirm: true
    });
    if (cError) throw cError;
    clientUser = cUser.user;

    const { data: fUser, error: fError } = await adminSupabase.auth.admin.createUser({
      email: freelancerEmail,
      password: testPassword,
      email_confirm: true
    });
    if (fError) throw fError;
    freelancerUser = fUser.user;

    // 2. Setup profiles & wallets
    await upsertProfile(clientUser.id, {
      full_name: 'Milestone Client',
      email: clientEmail,
      user_type: 'client',
      active_mode: 'client',
      onboarding_completed: true,
      cin_verified: true,
      phone_verified: true,
      payment_verified: true
    });

    await upsertProfile(freelancerUser.id, {
      full_name: 'Milestone Freelancer',
      email: freelancerEmail,
      user_type: 'freelancer',
      active_mode: 'freelancer',
      onboarding_completed: true,
      cin_verified: true,
      phone_verified: true,
      payment_verified: true
    });

    await upsertFreelancerProfile(freelancerUser.id, {
      availability: 'available',
      connects_balance: 50,
      skills: ['react', 'node']
    });

    await upsertWallet(clientUser.id, 500);
    await upsertWallet(freelancerUser.id, 100);

    // 3. Sign in users
    const { data: clientSession, error: clientLoginError } = await clientSupabase.auth.signInWithPassword({
      email: clientEmail,
      password: testPassword
    });
    if (clientLoginError) throw clientLoginError;

    const { data: freelancerSession, error: freelancerLoginError } = await freelancerSupabase.auth.signInWithPassword({
      email: freelancerEmail,
      password: testPassword
    });
    if (freelancerLoginError) throw freelancerLoginError;

    // 4. Create Job and Contract
    jobId = crypto.randomUUID();
    const { error: jobError } = await adminSupabase.from('jobs').insert({
      id: jobId,
      client_id: clientUser.id,
      title: 'Milestone Simulation Job',
      description: 'Simulation description with enough character length to satisfy limits.',
      category: 'development',
      subcategory: 'web_development',
      job_type: 'fixed_price',
      duration: 'less_than_1_month',
      experience_level: 'intermediate',
      visibility: 'public',
      status: 'open',
      budget_min: 100,
      budget_max: 200
    });
    if (jobError) throw jobError;

    contractId = crypto.randomUUID();
    const { error: contractError } = await adminSupabase.from('contracts').insert({
      id: contractId,
      job_id: jobId,
      client_id: clientUser.id,
      freelancer_id: freelancerUser.id,
      title: 'Milestone Contract',
      description: 'E2E test',
      amount: 100,
      contract_type: 'fixed_price',
      status: 'active', // Active status
      payment_status: 'in_escrow',
      funded_at: new Date().toISOString(),
      dhmad_escrow_id: 'mock_escrow_milestones'
    });
    if (contractError) throw contractError;

    // 5. Create two Milestones
    console.log('\n🏁 Creating two contract milestones...');
    milestone1Id = crypto.randomUUID();
    milestone2Id = crypto.randomUUID();

    const { error: m1Error } = await adminSupabase.from('milestones').insert({
      id: milestone1Id,
      contract_id: contractId,
      description: 'Milestone 1: Prototype design',
      amount: 40,
      status: 'pending'
    });
    if (m1Error) throw m1Error;

    const { error: m2Error } = await adminSupabase.from('milestones').insert({
      id: milestone2Id,
      contract_id: contractId,
      description: 'Milestone 2: Final implementation',
      amount: 60,
      status: 'pending'
    });
    if (m2Error) throw m2Error;

    console.log(`   Milestone 1 created: ${milestone1Id} (40 TND)`);
    console.log(`   Milestone 2 created: ${milestone2Id} (60 TND)`);

    // 6. Freelancer delivers Milestone 1
    console.log('\n📦 Freelancer delivers Milestone 1...');
    const { error: del1Error } = await freelancerSupabase.rpc('submit_milestone_delivery_atomic', {
      p_contract_id: contractId,
      p_milestone_id: milestone1Id,
      p_delivery_note: 'Here is the prototype layout for Milestone 1.',
      p_review_assets: [],
      p_final_assets: [],
      p_delivery_links: [
        { link_kind: 'review_link', url: 'https://staging.layout', label: 'Preview', category: 'vercel' },
        { link_kind: 'final_link', url: 'https://github.com/design', label: 'Design Assets', category: 'github' }
      ]
    });
    if (del1Error) throw del1Error;

    // Verify Milestone 1 status is submitted
    const { data: checkM1 } = await adminSupabase.from('milestones').select('status').eq('id', milestone1Id).single();
    const { data: checkContractState } = await adminSupabase.from('contracts').select('status').eq('id', contractId).single();
    console.log(`   Verification: Milestone 1 status = ${checkM1.status}, Contract status = ${checkContractState.status}`);
    if (checkM1.status !== 'submitted' || checkContractState.status !== 'delivery_submitted') {
      throw new Error('Milestone 1 submission state mismatch');
    }

    // 7. Client approves Milestone 1
    console.log('\n🎉 Client approves and releases payment for Milestone 1...');
    const { error: app1Error } = await clientSupabase.rpc('release_milestone_payment_atomic', {
      p_milestone_id: milestone1Id
    });
    if (app1Error) throw app1Error;

    // Verify Milestone 1 status is approved, and contract status reverted to active
    const { data: checkM1Post } = await adminSupabase.from('milestones').select('status, escrow_pending_clearance_until').eq('id', milestone1Id).single();
    const { data: checkContractPost } = await adminSupabase.from('contracts').select('status').eq('id', contractId).single();
    console.log(`   Verification: Milestone 1 status = ${checkM1Post.status}, Contract status = ${checkContractPost.status}`);
    if (checkM1Post.status !== 'approved' || checkContractPost.status !== 'active') {
      throw new Error('Milestone 1 approval status mismatch');
    }

    // 8. Freelancer delivers Milestone 2
    console.log('\n📦 Freelancer delivers Milestone 2...');
    const { error: del2Error } = await freelancerSupabase.rpc('submit_milestone_delivery_atomic', {
      p_contract_id: contractId,
      p_milestone_id: milestone2Id,
      p_delivery_note: 'Final code submitted for Milestone 2.',
      p_review_assets: [],
      p_final_assets: [],
      p_delivery_links: [
        { link_kind: 'review_link', url: 'https://staging.app', label: 'App Staging', category: 'vercel' },
        { link_kind: 'final_link', url: 'https://github.com/code', label: 'Production Repo', category: 'github' }
      ]
    });
    if (del2Error) throw del2Error;

    // 9. Client approves Milestone 2 (completing contract)
    console.log('\n🎉 Client approves and releases payment for Milestone 2...');
    const { error: app2Error } = await clientSupabase.rpc('release_milestone_payment_atomic', {
      p_milestone_id: milestone2Id
    });
    if (app2Error) throw app2Error;

    // Verify Milestone 2 status is approved, and contract status became completed
    const { data: checkM2Post } = await adminSupabase.from('milestones').select('status, escrow_pending_clearance_until').eq('id', milestone2Id).single();
    const { data: checkContractFinal } = await adminSupabase.from('contracts').select('status, payment_status').eq('id', contractId).single();
    console.log(`   Verification: Milestone 2 status = ${checkM2Post.status}, Contract status = ${checkContractFinal.status}, Payment status = ${checkContractFinal.payment_status}`);
    if (checkM2Post.status !== 'approved' || checkContractFinal.status !== 'completed') {
      throw new Error('Milestone 2 approval or final contract status mismatch');
    }

    // 10. Simulate passage of 48 hours for both milestones
    console.log('\n⏰ Accelerating hold period for both milestones...');
    const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago
    await adminSupabase.from('milestones').update({ escrow_pending_clearance_until: pastDate }).eq('contract_id', contractId);

    // 11. Finalize payment clearance for both milestones
    console.log('\n💸 Finalizing payment clearance for Milestone 1...');
    const { error: fin1Error } = await adminSupabase.rpc('finalize_milestone_clearance_payment', {
      p_milestone_id: milestone1Id
    });
    if (fin1Error) throw fin1Error;

    console.log('💸 Finalizing payment clearance for Milestone 2...');
    const { error: fin2Error } = await adminSupabase.rpc('finalize_milestone_clearance_payment', {
      p_milestone_id: milestone2Id
    });
    if (fin2Error) throw fin2Error;

    // 12. Verify Freelancer Wallet balance
    const { data: wallet } = await adminSupabase.from('wallets').select('balance').eq('user_id', freelancerUser.id).single();
    console.log(`   Freelancer Wallet Balance: ${wallet.balance} TND (Original: 100 TND, Expected: 200 TND)`);
    if (wallet.balance !== 200) {
      throw new Error('Freelancer was not credited correctly');
    }

    console.log('\n🟢 MULTI-MILESTONE SIMULATION COMPLETED WITH 100% SUCCESS!');

  } catch (err) {
    console.error('\n🔴 SIMULATION FAILED:', err.message || err);
  } finally {
    console.log('\n🧼 Cleaning up simulation records...');
    if (contractId) {
      await adminSupabase.from('contracts').delete().eq('id', contractId);
    }
    if (jobId) {
      await adminSupabase.from('jobs').delete().eq('id', jobId);
    }
    if (clientUser) {
      await adminSupabase.from('profiles').delete().eq('id', clientUser.id);
      await adminSupabase.from('wallets').delete().eq('user_id', clientUser.id);
      await adminSupabase.auth.admin.deleteUser(clientUser.id);
    }
    if (freelancerUser) {
      await adminSupabase.from('profiles').delete().eq('id', freelancerUser.id);
      await adminSupabase.from('freelancer_profiles').delete().eq('id', freelancerUser.id);
      await adminSupabase.from('wallets').delete().eq('user_id', freelancerUser.id);
      await adminSupabase.auth.admin.deleteUser(freelancerUser.id);
    }
    console.log('   Cleanup complete.');
  }
}

runMilestoneSimulation();
