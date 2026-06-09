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

const adminSupabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const clientSupabase = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false }
});

const freelancerSupabase = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: false }
});

const clientEmail = `sec_client_${crypto.randomUUID().slice(0, 8)}@workedin-test.tn`;
const freelancerEmail = `sec_free_${crypto.randomUUID().slice(0, 8)}@workedin-test.tn`;
const testPassword = 'SecurePassword123!';
const contractAmount = 100;

async function runSecurityAudit() {
  console.log('🛡️  STARTING STORAGE SECURITY & DELIVERABLES ACCESS CONTROL AUDIT\n');

  let clientUser, freelancerUser;
  let jobId, contractId;
  const reviewPath = `review_${crypto.randomUUID().slice(0, 8)}.txt`;
  const finalPath = `final_${crypto.randomUUID().slice(0, 8)}.txt`;
  let fullReviewPath, fullFinalPath;

  // Helper functions for safe upserting
  async function upsertProfile(userId, data) {
    const { data: existing } = await adminSupabase.from('profiles').select('id').eq('id', userId).maybeSingle();
    if (existing) {
      await adminSupabase.from('profiles').update(data).eq('id', userId);
    } else {
      await adminSupabase.from('profiles').insert({ id: userId, ...data });
    }
  }

  async function upsertFreelancerProfile(userId, data) {
    const { data: existing } = await adminSupabase.from('freelancer_profiles').select('id').eq('id', userId).maybeSingle();
    if (existing) {
      await adminSupabase.from('freelancer_profiles').update(data).eq('id', userId);
    } else {
      await adminSupabase.from('freelancer_profiles').insert({ id: userId, ...data });
    }
  }

  async function upsertWallet(userId, balance) {
    const { data: existing } = await adminSupabase.from('wallets').select('id, user_id').eq('user_id', userId).maybeSingle();
    if (existing) {
      await adminSupabase.from('wallets').update({ balance }).eq('user_id', userId);
    } else {
      await adminSupabase.from('wallets').insert({ user_id: userId, balance });
    }
  }

  try {
    // ── 1. Create mock client and freelancer auth users ──
    console.log('👥 Bootstrapping users in auth...');
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

    // Profiles & Wallets
    await upsertProfile(clientUser.id, {
      full_name: 'Security Audit Client',
      email: clientEmail,
      user_type: 'client',
      active_mode: 'client',
      onboarding_completed: true,
      cin_verified: true,
      phone_verified: true,
      payment_verified: true
    });

    await upsertProfile(freelancerUser.id, {
      full_name: 'Security Audit Freelancer',
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

    // Sign in to get JWT sessions
    const { data: cSession, error: cLoginError } = await clientSupabase.auth.signInWithPassword({
      email: clientEmail,
      password: testPassword
    });
    if (cLoginError) throw cLoginError;

    const { data: fSession, error: fLoginError } = await freelancerSupabase.auth.signInWithPassword({
      email: freelancerEmail,
      password: testPassword
    });
    if (fLoginError) throw fLoginError;

    // Create Job and Contract
    jobId = crypto.randomUUID();
    await adminSupabase.from('jobs').insert({
      id: jobId,
      client_id: clientUser.id,
      title: 'Security Audit Job',
      description: 'Verifying row level security storage rules',
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

    contractId = crypto.randomUUID();
    await adminSupabase.from('contracts').insert({
      id: contractId,
      job_id: jobId,
      client_id: clientUser.id,
      freelancer_id: freelancerUser.id,
      title: 'Security Audit Contract',
      description: 'Audit test record',
      amount: contractAmount,
      contract_type: 'fixed_price',
      status: 'pending_payment',
      payment_status: 'pending'
    });

    // Compute exact paths matching RPC prefixes
    fullReviewPath = `${freelancerUser.id}/${contractId}/submissions/review/${reviewPath}`;
    fullFinalPath = `${freelancerUser.id}/${contractId}/submissions/final/${finalPath}`;

    // ── 2. Freelancer uploads files ──
    console.log('\n📤 Freelancer uploading draft (review) and final deliverables...');
    
    const { error: rUploadError } = await freelancerSupabase.storage
      .from('contract-files')
      .upload(fullReviewPath, Buffer.from('REVIEW_ASSET_CONTENT_DRAFT'), { contentType: 'text/plain' });
    if (rUploadError) throw rUploadError;
    console.log(`   Review file uploaded to: ${fullReviewPath}`);

    const { error: fUploadError } = await freelancerSupabase.storage
      .from('contract-files')
      .upload(fullFinalPath, Buffer.from('FINAL_SOURCE_CODE_CONFIDENTIAL'), { contentType: 'text/plain' });
    if (fUploadError) throw fUploadError;
    console.log(`   Final file uploaded to: ${fullFinalPath}`);

    // ── 3. PRE-DELIVERY ACCESS TEST ──
    console.log('\n🔒 [TEST PHASE 1] Verifying access before contract delivery registration...');
    
    // Freelancer should be able to read own uploaded files
    const { data: fReadReviewPre, error: fReadReviewPreError } = await freelancerSupabase.storage
      .from('contract-files')
      .download(fullReviewPath);
    
    const { data: fReadFinalPre, error: fReadFinalPreError } = await freelancerSupabase.storage
      .from('contract-files')
      .download(fullFinalPath);

    if (fReadReviewPreError || fReadFinalPreError) {
      throw new Error(`Freelancer was blocked from reading their own uploaded files before delivery: ${fReadReviewPreError?.message || fReadFinalPreError?.message}`);
    }
    console.log('   ✓ Freelancer successfully downloaded own files pre-delivery.');

    // Client should NOT be able to read review file
    const { data: cReadReviewPre, error: cReadReviewPreError } = await clientSupabase.storage
      .from('contract-files')
      .download(fullReviewPath);

    // Client should NOT be able to read final file
    const { data: cReadFinalPre, error: cReadFinalPreError } = await clientSupabase.storage
      .from('contract-files')
      .download(fullFinalPath);

    if (!cReadReviewPreError && cReadReviewPre) {
      throw new Error('SECURITY VIOLATION: Client downloaded review file before contract delivery was submitted!');
    }
    if (!cReadFinalPreError && cReadFinalPre) {
      throw new Error('SECURITY VIOLATION: Client downloaded final file before contract delivery was submitted!');
    }
    console.log('   ✓ Client access successfully blocked for both files pre-delivery (returns error as expected).');

    // ── 4. Client funds the escrow (needed to transition contract status to active) ──
    console.log('\n💰 Funding contract escrow to enable delivery submission...');
    await clientSupabase.rpc('sandbox_fund_escrow', { p_contract_id: contractId });
    
    const { error: updateEscrowError } = await adminSupabase
      .from('contracts')
      .update({
        dhmad_escrow_id: 'mock_sec_escrow',
        escrow_funded: true
      })
      .eq('id', contractId);
    if (updateEscrowError) {
      const { error: fallbackError } = await adminSupabase
        .from('contracts')
        .update({
          dhmad_escrow_id: 'mock_sec_escrow'
        })
        .eq('id', contractId);
      if (fallbackError) throw fallbackError;
    }

    // ── 5. Freelancer submits delivery ──
    console.log('\n📦 Freelancer registering delivery via atomic RPC...');
    const { error: deliveryError } = await freelancerSupabase.rpc('submit_contract_delivery_atomic', {
      p_contract_id: contractId,
      p_delivery_note: 'Security audit delivery note.',
      p_review_assets: [
        {
          name: 'review_doc.txt',
          storage_bucket: 'contract-files',
          storage_path: fullReviewPath,
          mime_type: 'text/plain',
          size_bytes: '27'
        }
      ],
      p_final_assets: [
        {
          name: 'final_doc.txt',
          storage_bucket: 'contract-files',
          storage_path: fullFinalPath,
          mime_type: 'text/plain',
          size_bytes: '33'
        }
      ],
      p_delivery_links: []
    });
    if (deliveryError) throw deliveryError;
    console.log('   ✓ Delivery registered successfully in database.');

    // ── 6. POST-DELIVERY ACCESS TEST (PRE-APPROVAL) ──
    console.log('\n👁️  [TEST PHASE 2] Verifying access after delivery registration (pending review)...');

    // Client should now be allowed to read the review file (draft/watermarked preview)
    const { data: cReadReviewPost, error: cReadReviewPostError } = await clientSupabase.storage
      .from('contract-files')
      .download(fullReviewPath);
    
    if (cReadReviewPostError) {
      throw new Error(`Access failed: Client was blocked from reading review_asset: ${cReadReviewPostError.message}`);
    }
    
    const reviewContent = await cReadReviewPost.text();
    if (reviewContent !== 'REVIEW_ASSET_CONTENT_DRAFT') {
      throw new Error(`Content mismatch on review file: ${reviewContent}`);
    }
    console.log('   ✓ Client successfully downloaded review_asset (preview).');

    // Client must STILL be blocked from reading the final source code file
    const { data: cReadFinalPost, error: cReadFinalPostError } = await clientSupabase.storage
      .from('contract-files')
      .download(fullFinalPath);

    if (!cReadFinalPostError && cReadFinalPost) {
      throw new Error('SECURITY VIOLATION: Client successfully downloaded final_asset source code before releasing payment!');
    }
    console.log('   ✓ Client access to final_asset correctly blocked (returns error as expected).');

    // ── 7. Client approves and releases payment ──
    console.log('\n🎉 Client approving delivery and releasing payment...');
    const { error: approveError } = await clientSupabase.rpc('release_contract_payment_atomic', {
      p_contract_id: contractId
    });
    if (approveError) throw approveError;
    console.log('   ✓ Payment released. Final deliverables unlocked.');

    // ── 8. POST-APPROVAL ACCESS TEST ──
    console.log('\n🔓 [TEST PHASE 3] Verifying access after payment release...');

    // Client should now have access to download the final source code file
    const { data: cReadFinalRelease, error: cReadFinalReleaseError } = await clientSupabase.storage
      .from('contract-files')
      .download(fullFinalPath);

    if (cReadFinalReleaseError) {
      throw new Error(`Access failed: Client was blocked from final deliverable after payment release: ${cReadFinalReleaseError.message}`);
    }

    const finalContent = await cReadFinalRelease.text();
    if (finalContent !== 'FINAL_SOURCE_CODE_CONFIDENTIAL') {
      throw new Error(`Content mismatch on final file: ${finalContent}`);
    }
    console.log('   ✓ Client successfully downloaded final_asset source code!');

    console.log('\n🟢 STORAGE SECURITY AUDIT PASSED WITH 100% COMPLIANCE!');

  } catch (err) {
    console.error('\n🔴 SECURITY AUDIT FAILED:', err.message || err);
  } finally {
    console.log('\n🧼 Cleaning up audit storage objects and records...');
    // Delete files from storage
    if (fullReviewPath) {
      await adminSupabase.storage.from('contract-files').remove([fullReviewPath]);
    }
    if (fullFinalPath) {
      await adminSupabase.storage.from('contract-files').remove([fullFinalPath]);
    }
    // Delete DB rows
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
    console.log('   Cleanup complete. Storage & DB returned to original state.');
  }
}

runSecurityAudit();
