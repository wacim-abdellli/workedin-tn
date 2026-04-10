import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const configuredOrigins = (
  Deno.env.get('ALLOWED_ORIGINS')
  || Deno.env.get('ALLOWED_ORIGIN')
  || 'https://workedin-tn.vercel.app,http://localhost:5173,http://127.0.0.1:5173'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

function getCorsHeaders(requestOrigin: string | null) {
  const defaultOrigin = configuredOrigins[0] || '*'
  const allowOrigin = requestOrigin && configuredOrigins.includes(requestOrigin)
    ? requestOrigin
    : defaultOrigin

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
  }
}

function jsonResponse(corsHeaders: Record<string, string>, status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

interface AdminContext {
  id: string;
  isSuperAdmin: boolean;
}

async function assertAdmin(adminClient: ReturnType<typeof createClient>, userId: string): Promise<AdminContext> {
  const { data, error } = await adminClient
    .from('profiles')
    .select('id,is_admin,is_super_admin,account_status')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to verify admin status: ${error.message}`)
  }

  if (!data?.is_admin) {
    throw new Error('Admin privileges required')
  }

  if (data.account_status === 'suspended' || data.account_status === 'archived') {
    throw new Error('Admin account is not active')
  }

  return {
    id: userId,
    isSuperAdmin: Boolean(data.is_super_admin),
  }
}

async function logAdminAction(
  adminClient: ReturnType<typeof createClient>,
  payload: {
    adminId: string;
    action: string;
    targetUserId?: string | null;
    reason?: string | null;
    metadata?: Record<string, unknown>;
  }
) {
  await adminClient
    .from('admin_audit_logs')
    .insert({
      admin_id: payload.adminId,
      action: payload.action,
      target_user_id: payload.targetUserId ?? null,
      entity_type: 'profile',
      entity_id: payload.targetUserId ?? null,
      reason: payload.reason ?? null,
      metadata: payload.metadata ?? {},
    })
}

async function getUserDetails(adminClient: ReturnType<typeof createClient>, userId: string) {
  const [profile, freelancerProfile, wallet] = await Promise.all([
    adminClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle(),
    adminClient
      .from('freelancer_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle(),
    adminClient
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  if (profile.error) throw new Error(`Profile fetch failed: ${profile.error.message}`)
  if (freelancerProfile.error) throw new Error(`Freelancer profile fetch failed: ${freelancerProfile.error.message}`)
  if (wallet.error) throw new Error(`Wallet fetch failed: ${wallet.error.message}`)

  const [jobsCount, proposalsCount, contractsAsClientCount, contractsAsFreelancerCount, messagesSentCount, messagesReceivedCount, reviewsGivenCount, reviewsReceivedCount] = await Promise.all([
    adminClient.from('jobs').select('id', { count: 'exact', head: true }).eq('client_id', userId),
    adminClient.from('proposals').select('id', { count: 'exact', head: true }).eq('freelancer_id', userId),
    adminClient.from('contracts').select('id', { count: 'exact', head: true }).eq('client_id', userId),
    adminClient.from('contracts').select('id', { count: 'exact', head: true }).eq('freelancer_id', userId),
    adminClient.from('messages').select('id', { count: 'exact', head: true }).eq('sender_id', userId),
    adminClient.from('messages').select('id', { count: 'exact', head: true }).eq('receiver_id', userId),
    adminClient.from('reviews').select('id', { count: 'exact', head: true }).eq('reviewer_id', userId),
    adminClient.from('reviews').select('id', { count: 'exact', head: true }).eq('reviewee_id', userId),
  ])

  const countErrors = [
    jobsCount.error,
    proposalsCount.error,
    contractsAsClientCount.error,
    contractsAsFreelancerCount.error,
    messagesSentCount.error,
    messagesReceivedCount.error,
    reviewsGivenCount.error,
    reviewsReceivedCount.error,
  ].filter(Boolean)

  if (countErrors.length > 0) {
    throw new Error(`Count queries failed: ${(countErrors[0] as { message?: string }).message || 'unknown error'}`)
  }

  return {
    profile: profile.data,
    freelancerProfile: freelancerProfile.data,
    wallet: wallet.data,
    counts: {
      jobs: jobsCount.count ?? 0,
      proposals: proposalsCount.count ?? 0,
      contracts: (contractsAsClientCount.count ?? 0) + (contractsAsFreelancerCount.count ?? 0),
      messages: (messagesSentCount.count ?? 0) + (messagesReceivedCount.count ?? 0),
      reviews: (reviewsGivenCount.count ?? 0) + (reviewsReceivedCount.count ?? 0),
    },
  }
}

async function setUserStatus(adminClient: ReturnType<typeof createClient>, adminContext: AdminContext, payload: Record<string, unknown>) {
  const userId = typeof payload.userId === 'string' ? payload.userId : ''
  const nextStatus = typeof payload.nextStatus === 'string' ? payload.nextStatus : ''
  const reason = typeof payload.reason === 'string' ? payload.reason : null

  if (!userId) throw new Error('Missing userId')
  if (!['active', 'suspended', 'archived'].includes(nextStatus)) {
    throw new Error('Invalid nextStatus')
  }

  const rpc = await adminClient.rpc('set_user_account_status', {
    p_user_id: userId,
    p_next_status: nextStatus,
    p_reason: reason,
  })

  if (rpc.error) {
    const fallback = await adminClient
      .from('profiles')
      .update({ account_status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', userId)

    if (fallback.error) {
      throw new Error(`Status update failed: ${fallback.error.message}`)
    }
  }

  await logAdminAction(adminClient, {
    adminId: adminContext.id,
    action: nextStatus === 'active' ? 'user_reactivated' : nextStatus === 'archived' ? 'user_archived' : 'user_suspended',
    targetUserId: userId,
    reason,
    metadata: { via: 'admin-user-control', nextStatus },
  })

  return { userId, nextStatus }
}

async function softDeleteUser(adminClient: ReturnType<typeof createClient>, adminContext: AdminContext, payload: Record<string, unknown>) {
  const userId = typeof payload.userId === 'string' ? payload.userId : ''
  const reason = typeof payload.reason === 'string' ? payload.reason : null

  if (!userId) throw new Error('Missing userId')
  if (userId === adminContext.id) throw new Error('You cannot archive your own account')

  const targetProfile = await adminClient
    .from('profiles')
    .select('id,is_admin,is_super_admin,account_status')
    .eq('id', userId)
    .maybeSingle()

  if (targetProfile.error) throw new Error(`Target profile lookup failed: ${targetProfile.error.message}`)
  if (!targetProfile.data) throw new Error('Target user not found')

  if (targetProfile.data.is_super_admin) {
    throw new Error('Super admin accounts cannot be archived')
  }

  const usernameAlias = `deleted_${userId.slice(0, 8)}`

  const profileUpdate = await adminClient
    .from('profiles')
    .update({
      account_status: 'archived',
      full_name: 'Deleted User',
      username: usernameAlias,
      phone: null,
      location: null,
      bio: null,
      avatar_url: null,
      avatar_url_client: null,
      avatar_url_freelancer: null,
      company_name: null,
      company_website: null,
      company_industry: null,
      company_size: null,
      company_role: null,
      hiring_needs: [],
      communication_preferences: {},
      screening_preferences: {},
      legal_preferences: {},
      deleted_at: new Date().toISOString(),
      deleted_by: adminContext.id,
      deletion_reason: reason ?? 'Archived by admin',
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (profileUpdate.error) {
    throw new Error(`Archive profile update failed: ${profileUpdate.error.message}`)
  }

  await adminClient
    .from('freelancer_profiles')
    .update({
      title: null,
      hourly_rate: null,
      availability: 'offline',
      skills: [],
      tools: [],
      industries: [],
      portfolio_links: [],
      revision_policy: null,
      project_preferences: {},
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  const authUpdate = await adminClient.auth.admin.updateUserById(userId, {
    ban_duration: '876000h',
    user_metadata: {
      account_archived: true,
      archived_at: new Date().toISOString(),
    },
  })

  if (authUpdate.error) {
    throw new Error(`Auth archive update failed: ${authUpdate.error.message}`)
  }

  await logAdminAction(adminClient, {
    adminId: adminContext.id,
    action: 'user_archived_soft_delete',
    targetUserId: userId,
    reason,
    metadata: { via: 'admin-user-control' },
  })

  return { userId, mode: 'soft' }
}

async function hardDeleteUser(adminClient: ReturnType<typeof createClient>, adminContext: AdminContext, payload: Record<string, unknown>) {
  if (!adminContext.isSuperAdmin) {
    throw new Error('Hard delete requires super admin privileges')
  }

  const userId = typeof payload.userId === 'string' ? payload.userId : ''
  const reason = typeof payload.reason === 'string' ? payload.reason : null

  if (!userId) throw new Error('Missing userId')
  if (userId === adminContext.id) throw new Error('You cannot delete your own account')

  const targetProfile = await adminClient
    .from('profiles')
    .select('id,is_admin,is_super_admin')
    .eq('id', userId)
    .maybeSingle()

  if (targetProfile.error) throw new Error(`Target profile lookup failed: ${targetProfile.error.message}`)
  if (!targetProfile.data) throw new Error('Target user not found')
  if (targetProfile.data.is_admin || targetProfile.data.is_super_admin) {
    throw new Error('Admin accounts cannot be permanently deleted from this endpoint')
  }

  const [contractsCount, transactionsCount, disputesAsOpener, disputesAsAgainst] = await Promise.all([
    adminClient.from('contracts').select('id', { count: 'exact', head: true }).or(`client_id.eq.${userId},freelancer_id.eq.${userId}`),
    adminClient.from('transactions').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    adminClient.from('disputes').select('id', { count: 'exact', head: true }).eq('opened_by', userId),
    adminClient.from('disputes').select('id', { count: 'exact', head: true }).eq('against_user_id', userId),
  ])

  if (contractsCount.error || transactionsCount.error || disputesAsOpener.error || disputesAsAgainst.error) {
    throw new Error('Failed to validate deletion constraints')
  }

  const legalLocks = (contractsCount.count ?? 0) + (transactionsCount.count ?? 0) + (disputesAsOpener.count ?? 0) + (disputesAsAgainst.count ?? 0)
  if (legalLocks > 0) {
    throw new Error('Hard delete blocked: user has legal/financial history. Use archive instead.')
  }

  await logAdminAction(adminClient, {
    adminId: adminContext.id,
    action: 'user_hard_deleted',
    targetUserId: userId,
    reason,
    metadata: { via: 'admin-user-control' },
  })

  const deleteResult = await adminClient.auth.admin.deleteUser(userId)
  if (deleteResult.error) {
    throw new Error(`Hard delete failed: ${deleteResult.error.message}`)
  }

  return { userId, mode: 'hard' }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'))

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } },
    )

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) {
      return jsonResponse(corsHeaders, 401, { error: 'Unauthorized' })
    }

    const adminContext = await assertAdmin(adminClient, user.id)

    const body = await req.json().catch(() => ({} as Record<string, unknown>)) as Record<string, unknown>
    const action = typeof body.action === 'string' ? body.action : ''

    if (action === 'get_user_details') {
      const targetUserId = typeof body.userId === 'string' ? body.userId : ''
      if (!targetUserId) return jsonResponse(corsHeaders, 400, { error: 'Missing userId' })
      const details = await getUserDetails(adminClient, targetUserId)
      return jsonResponse(corsHeaders, 200, { data: details })
    }

    if (action === 'set_user_status') {
      const result = await setUserStatus(adminClient, adminContext, body)
      return jsonResponse(corsHeaders, 200, { data: result })
    }

    if (action === 'soft_delete_user') {
      const result = await softDeleteUser(adminClient, adminContext, body)
      return jsonResponse(corsHeaders, 200, { data: result })
    }

    if (action === 'hard_delete_user') {
      const result = await hardDeleteUser(adminClient, adminContext, body)
      return jsonResponse(corsHeaders, 200, { data: result })
    }

    return jsonResponse(corsHeaders, 400, { error: 'Unsupported action' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    console.error('[admin-user-control] error:', message)
    return jsonResponse(corsHeaders, 500, { error: message })
  }
})
