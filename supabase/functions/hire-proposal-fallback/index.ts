import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const configuredOrigins = (
  Deno.env.get('ALLOWED_ORIGINS')
  || Deno.env.get('ALLOWED_ORIGIN')
  || 'https://khedmetna.tn,https://workedin.tn,https://workedin-tn.vercel.app,http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174'
)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

function isLocalDevOrigin(origin: string): boolean {
  return /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin)
}

function isAllowedOrigin(origin: string): boolean {
  return configuredOrigins.includes(origin) || isLocalDevOrigin(origin)
}

function getCorsHeaders(requestOrigin: string | null) {
  const defaultOrigin = configuredOrigins[0] || '*'
  const allowOrigin = requestOrigin && isAllowedOrigin(requestOrigin)
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

function asSingle<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }
  return value ?? null
}

function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') {
    return 'Unknown error'
  }

  const maybeMessage = (error as { message?: unknown }).message
  if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
    return maybeMessage
  }

  return 'Unknown error'
}

function hasDuplicateContractError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase()
  return message.includes('duplicate key') || message.includes('violates unique constraint')
}

function cleanInsertPayload(payload: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined))
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'))

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse(corsHeaders, 405, { error: 'Method not allowed' })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse(corsHeaders, 401, { error: 'Missing authorization' })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return jsonResponse(corsHeaders, 500, { error: 'Missing required Supabase environment configuration' })
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey)

    const { data: authData, error: authError } = await userClient.auth.getUser()
    if (authError || !authData?.user) {
      return jsonResponse(corsHeaders, 401, { error: 'Unauthorized' })
    }

    const userId = authData.user.id

    const body = await req.json().catch(() => null)
    const proposalId = body && typeof body === 'object' && typeof (body as { proposalId?: unknown }).proposalId === 'string'
      ? (body as { proposalId: string }).proposalId
      : ''

    if (!proposalId) {
      return jsonResponse(corsHeaders, 400, { error: 'proposalId is required' })
    }

    const { data: proposalRow, error: proposalError } = await adminClient
      .from('proposals')
      .select('id,job_id,freelancer_id,bid_amount,status,job:jobs(id,client_id,title,description,job_type)')
      .eq('id', proposalId)
      .maybeSingle()

    if (proposalError || !proposalRow) {
      return jsonResponse(corsHeaders, 404, { error: 'Proposal not found' })
    }

    const jobRow = asSingle(
      (proposalRow as {
        job?: {
          id: string
          client_id: string
          title?: string | null
          description?: string | null
          job_type?: string | null
        } | Array<{
          id: string
          client_id: string
          title?: string | null
          description?: string | null
          job_type?: string | null
        }> | null
      }).job,
    )

    if (!jobRow) {
      return jsonResponse(corsHeaders, 400, { error: 'Proposal is missing an associated job' })
    }

    const proposalStatus = String((proposalRow as { status?: unknown }).status ?? '').toLowerCase()
    const hireableStatuses = new Set(['new', 'pending', 'shortlisted'])
    if (!hireableStatuses.has(proposalStatus)) {
      return jsonResponse(corsHeaders, 409, { error: 'Only new, pending, or shortlisted proposals can be hired' })
    }

    if (jobRow.client_id !== userId) {
      return jsonResponse(corsHeaders, 403, { error: 'Only the job owner can hire this proposal' })
    }

    const { data: existingByProposal, error: existingByProposalError } = await adminClient
      .from('contracts')
      .select('id')
      .eq('proposal_id', proposalId)
      .maybeSingle()

    if (existingByProposalError) {
      return jsonResponse(corsHeaders, 500, { error: `Failed to check existing contract: ${existingByProposalError.message}` })
    }

    if (existingByProposal?.id) {
      return jsonResponse(corsHeaders, 200, {
        success: true,
        contract_id: existingByProposal.id,
        existing: true,
      })
    }

    const { data: existingByJob, error: existingByJobError } = await adminClient
      .from('contracts')
      .select('id,status')
      .eq('job_id', jobRow.id)
      .neq('status', 'cancelled')
      .maybeSingle()

    if (existingByJobError) {
      return jsonResponse(corsHeaders, 500, { error: `Failed to check job contract state: ${existingByJobError.message}` })
    }

    if (existingByJob?.id) {
      return jsonResponse(corsHeaders, 409, {
        error: 'A contract already exists for this job',
        contract_id: existingByJob.id,
      })
    }

    const amount = Number(proposalRow.bid_amount ?? 0)
    if (!Number.isFinite(amount) || amount <= 0) {
      return jsonResponse(corsHeaders, 400, { error: 'Invalid proposal amount' })
    }

    const baseInsert = {
      job_id: jobRow.id,
      proposal_id: proposalId,
      client_id: jobRow.client_id,
      freelancer_id: proposalRow.freelancer_id,
      amount,
      title: jobRow.title || 'Contract',
      description: jobRow.description ?? null,
      payment_status: 'pending',
    }

    const insertAttempts: Array<Record<string, unknown>> = [
      cleanInsertPayload({ ...baseInsert, contract_type: jobRow.job_type ?? undefined, status: 'pending_payment' }),
      cleanInsertPayload({ ...baseInsert, contract_type: jobRow.job_type ?? undefined, status: 'active' }),
      cleanInsertPayload({ ...baseInsert, status: 'active' }),
    ]

    let contractId: string | null = null
    let lastInsertErrorMessage = 'Failed to create contract'

    for (const payload of insertAttempts) {
      const { data: inserted, error: insertError } = await adminClient
        .from('contracts')
        .insert(payload)
        .select('id')
        .single()

      if (!insertError && inserted?.id) {
        contractId = inserted.id
        break
      }

      if (insertError) {
        lastInsertErrorMessage = insertError.message

        if (hasDuplicateContractError(insertError)) {
          const { data: duplicateContract } = await adminClient
            .from('contracts')
            .select('id')
            .eq('proposal_id', proposalId)
            .maybeSingle()

          if (duplicateContract?.id) {
            contractId = duplicateContract.id
            break
          }
        }
      }
    }

    if (!contractId) {
      return jsonResponse(corsHeaders, 500, {
        error: `Contract creation failed: ${lastInsertErrorMessage}`,
      })
    }

    const updateErrors: string[] = []

    const { error: acceptError } = await adminClient
      .from('proposals')
      .update({ status: 'accepted' })
      .eq('id', proposalId)

    if (acceptError) {
      updateErrors.push(`accepted proposal update failed: ${acceptError.message}`)
    }

    const { error: rejectError } = await adminClient
      .from('proposals')
      .update({ status: 'rejected' })
      .eq('job_id', jobRow.id)
      .neq('id', proposalId)
      .neq('status', 'rejected')

    if (rejectError) {
      updateErrors.push(`competing proposals update failed: ${rejectError.message}`)
    }

    const { error: jobUpdateError } = await adminClient
      .from('jobs')
      .update({ status: 'in_progress', updated_at: new Date().toISOString() })
      .eq('id', jobRow.id)

    if (jobUpdateError) {
      updateErrors.push(`job update failed: ${jobUpdateError.message}`)
    }

    return jsonResponse(corsHeaders, 200, {
      success: true,
      contract_id: contractId,
      job_id: jobRow.id,
      freelancer_id: proposalRow.freelancer_id,
      amount,
      existing: false,
      warnings: updateErrors,
    })
  } catch (error) {
    return jsonResponse(corsHeaders, 500, {
      error: 'Internal server error',
      details: getErrorMessage(error),
    })
  }
})