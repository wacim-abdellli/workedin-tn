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

// ── Initialize Supabase Clients ───────────────────────────────────────────────
const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const clientSupabase = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false }
});

const freelancerSupabase = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false }
});

// Mock values
const clientEmail = `test_client_${crypto.randomUUID().slice(0, 8)}@workedin-test.tn`;
const freelancerEmail = `test_freelancer_${crypto.randomUUID().slice(0, 8)}@workedin-test.tn`;
const testPassword = 'SecurePassword123!';
const contractAmount = 100; // TND

async function runSimulation() {
  console.log('🚀 INITIALIZING E2E ESCROW LIFECYCLE SIMULATION\n');
  
  let clientUser, freelancerUser;
  let contractId, jobId;

  // Helper functions for safe upserting (handles db triggers automatically creating profiles/wallets)
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
    // ── 1. Create client and freelancer auth users ──
    console.log('👥 Creating mock client and freelancer in Auth...');
    
    const { data: cUser, error: cError } = await adminSupabase.auth.admin.createUser({
      email: clientEmail,
      password: testPassword,
      email_confirm: true
    });
    if (cError) throw cError;
    clientUser = cUser.user;
    console.log(`   Client created: ${clientUser.id}`);

    const { data: fUser, error: fError } = await adminSupabase.auth.admin.createUser({
      email: freelancerEmail,
      password: testPassword,
      email_confirm: true
    });
    if (fError) throw fError;
    freelancerUser = fUser.user;
    console.log(`   Freelancer created: ${freelancerUser.id}`);

    // ── 2. Create public profiles ──
    console.log('\n📄 Creating/updating user profiles...');
    
    await upsertProfile(clientUser.id, {
      full_name: 'Simulation Client',
      email: clientEmail,
      user_type: 'client',
      active_mode: 'client',
      onboarding_completed: true,
      cin_verified: true,
      phone_verified: true,
      payment_verified: true
    });

    await upsertProfile(freelancerUser.id, {
      full_name: 'Simulation Freelancer',
      email: freelancerEmail,
      user_type: 'freelancer',
      active_mode: 'freelancer',
      onboarding_completed: true,
      cin_verified: true,
      phone_verified: true,
      payment_verified: true
    });

    // Bootstrap freelancer profile sub-table
    await upsertFreelancerProfile(freelancerUser.id, {
      availability: 'available',
      connects_balance: 50,
      skills: ['react', 'node']
    });

    // ── 3. Bootstrap wallets ──
    console.log('\n💳 Creating/updating wallets with initial balances...');
    
    await upsertWallet(clientUser.id, 500);
    await upsertWallet(freelancerUser.id, 100);
    console.log('   Wallets initialized: Client (500 TND), Freelancer (100 TND)');

    // ── 4. Sign in clients to get active JWTs ──
    console.log('\n🔑 Signing in users to generate JWT sessions...');
    
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
    console.log('   Sessions acquired successfully.');

    // ── 5. Create Job and Contract ──
    console.log('\n📝 Inserting new job and contract...');
    jobId = crypto.randomUUID();
    const { error: jobInsertError } = await adminSupabase.from('jobs').insert({
      id: jobId,
      client_id: clientUser.id,
      title: 'E2E Simulation Job Title',
      description: 'This is a simulation job description with enough characters to satisfy any potential constraints.',
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
    if (jobInsertError) throw jobInsertError;
    console.log(`   Job created: ${jobId}`);

    contractId = crypto.randomUUID();
    const { error: contractInsertError } = await adminSupabase.from('contracts').insert({
      id: contractId,
      job_id: jobId,
      client_id: clientUser.id,
      freelancer_id: freelancerUser.id,
      title: 'E2E Escrow Simulation Job',
      description: 'Staging verification test',
      amount: contractAmount,
      contract_type: 'fixed_price',
      status: 'pending_payment',
      payment_status: 'pending'
    });
    if (contractInsertError) throw contractInsertError;
    console.log(`   Contract created: ${contractId} in 'pending_payment' status.`);

    // ── 6. Client funds the escrow ──
    console.log('\n💰 [STEP 1] Client funds the escrow via sandbox RPC...');
    
    const { error: fundError } = await clientSupabase.rpc('sandbox_fund_escrow', {
      p_contract_id: contractId
    });
    if (fundError) throw fundError;

    // Update contract to set mock escrow IDs & status to satisfy production release constraint
    const { error: updateEscrowError } = await adminSupabase
      .from('contracts')
      .update({
        dhmad_escrow_id: 'mock_escrow_123',
        escrow_funded: true
      })
      .eq('id', contractId);
    if (updateEscrowError) {
      const { error: fallbackError } = await adminSupabase
        .from('contracts')
        .update({
          dhmad_escrow_id: 'mock_escrow_123'
        })
        .eq('id', contractId);
      if (fallbackError) throw fallbackError;
    }

    // Verify contract is now funded
    const { data: fundedContract, error: fetchFundError } = await adminSupabase
      .from('contracts')
      .select('status, payment_status, funded_at, dhmad_escrow_id')
      .eq('id', contractId)
      .single();
    
    if (fetchFundError) throw fetchFundError;
    console.log('   DB Verification:');
    console.log(`     - status: ${fundedContract.status}`);
    console.log(`     - payment_status: ${fundedContract.payment_status}`);
    console.log(`     - dhmad_escrow_id: ${fundedContract.dhmad_escrow_id}`);
    console.log(`     - funded_at: ${fundedContract.funded_at}`);

    if (fundedContract.status !== 'active' || fundedContract.payment_status !== 'in_escrow') {
      throw new Error('Contract funding transition verification failed!');
    }

    // ── 7. Freelancer submits delivery ──
    console.log('\n📦 [STEP 2] Freelancer submits delivery package (review + final links)...');
    
    const { data: deliveryResult, error: deliveryError } = await freelancerSupabase.rpc('submit_contract_delivery_atomic', {
      p_contract_id: contractId,
      p_delivery_note: 'Here is the staging preview and source repository.',
      p_review_assets: [],
      p_final_assets: [],
      p_delivery_links: [
        {
          link_kind: 'review_link',
          url: 'https://staging-workedin.vercel.app',
          label: 'Vercel Deployment',
          category: 'vercel'
        },
        {
          link_kind: 'final_link',
          url: 'https://github.com/test/repo',
          label: 'GitHub Codebase',
          category: 'github',
          credentials: 'admin_credential_key'
        }
      ]
    });
    if (deliveryError) throw deliveryError;

    // Verify contract status
    const { data: deliveredContract, error: fetchDelivError } = await adminSupabase
      .from('contracts')
      .select('status, delivery_note, delivery_submitted_at')
      .eq('id', contractId)
      .single();

    if (fetchDelivError) throw fetchDelivError;
    console.log('   DB Verification:');
    console.log(`     - status: ${deliveredContract.status}`);
    console.log(`     - delivery_note: ${deliveredContract.delivery_note}`);
    console.log(`     - delivery_submitted_at: ${deliveredContract.delivery_submitted_at}`);

    if (deliveredContract.status !== 'delivery_submitted') {
      throw new Error('Delivery status transition verification failed!');
    }

    // ── 8. Client approves the delivery ──
    console.log('\n🎉 [STEP 3] Client approves and releases payment via RPC...');
    
    // Simulating hook bypass: set dhmad_escrow_id on mock if not set
    const { error: approveError } = await clientSupabase.rpc('release_contract_payment_atomic', {
      p_contract_id: contractId
    });
    if (approveError) throw approveError;

    const { data: completedContract, error: fetchCompError } = await adminSupabase
      .from('contracts')
      .select('status, payment_status, completed_at, escrow_pending_clearance_until, escrow_hold_disputed')
      .eq('id', contractId)
      .single();

    if (fetchCompError) throw fetchCompError;
    console.log('   DB Verification (Hold Period Initiated):');
    console.log(`     - status: ${completedContract.status}`);
    console.log(`     - payment_status: ${completedContract.payment_status}`);
    console.log(`     - completed_at: ${completedContract.completed_at}`);
    console.log(`     - escrow_pending_clearance_until: ${completedContract.escrow_pending_clearance_until}`);
    console.log(`     - escrow_hold_disputed: ${completedContract.escrow_hold_disputed}`);

    if (completedContract.status !== 'completed' || completedContract.payment_status !== 'in_escrow') {
      throw new Error('Approval completed status verification failed!');
    }

    // ── 9. Simulate the passage of 48 hours ──
    console.log('\n⏰ [STEP 4] Accelerating hold period (setting pending clearance date to the past)...');
    
    const pastDate = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour in the past
    const { error: dateUpdateError } = await adminSupabase
      .from('contracts')
      .update({ escrow_pending_clearance_until: pastDate })
      .eq('id', contractId);
    
    if (dateUpdateError) throw dateUpdateError;
    console.log('   Clearance threshold successfully updated to the past.');

    // ── 10. Finalize payment clearance (simulate cron trigger) ──
    console.log('\n💸 [STEP 5] Running hold clearance finalization...');
    
    const { error: finalizeError } = await adminSupabase.rpc('finalize_clearance_payment', {
      p_contract_id: contractId
    });
    if (finalizeError) throw finalizeError;

    // Verify contract and wallet values
    const { data: finalizedContract } = await adminSupabase
      .from('contracts')
      .select('payment_status')
      .eq('id', contractId)
      .single();

    const { data: freelancerWallet } = await adminSupabase
      .from('wallets')
      .select('balance')
      .eq('user_id', freelancerUser.id)
      .single();

    console.log('   DB Verification (Clearance Finalized):');
    console.log(`     - payment_status: ${finalizedContract.payment_status}`);
    console.log(`     - Freelancer Wallet Balance: ${freelancerWallet.balance} TND (Original: 100 TND, Expected: 200 TND)`);

    if (finalizedContract.payment_status !== 'released') {
      throw new Error('Payment status did not transition to released.');
    }
    if (freelancerWallet.balance !== 200) {
      throw new Error('Freelancer wallet was not credited the contract amount.');
    }

    console.log('\n🟢 LIFECYCLE SIMULATION COMPLETED WITH 100% SUCCESS!');

  } catch (err) {
    console.error('\n🔴 SIMULATION FAILED:', err.message || err);
  } finally {
    // ── 11. Cleanup test data ──
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
    console.log('   Cleanup complete. System back to original state.');
  }
}

runSimulation();
