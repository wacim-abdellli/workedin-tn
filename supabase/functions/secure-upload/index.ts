import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

import {
  getRawStoragePathSegments,
  getUploadPolicy,
  isUploadRateLimited,
  sanitizeStoragePath,
  validateUploadPayload,
} from '../../../src/lib/uploadPolicy.ts'

const configuredOrigins = (
  Deno.env.get('ALLOWED_ORIGINS')
  || Deno.env.get('ALLOWED_ORIGIN')
  || 'https://khedmetna.tn,http://localhost:5173,http://127.0.0.1:5173'
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

async function logUploadEvent(adminClient: any, payload: Record<string, unknown>) {
  try {
    await adminClient.from('upload_audit_log').insert(payload)
  } catch (error) {
    console.error('[upload_audit_log] failed to write:', error)
  }
}

async function validateMessageAttachmentScope(adminClient: any, userId: string, desiredPath: string) {
  const conversationId = getRawStoragePathSegments(desiredPath)[0]

  if (!conversationId) {
    return { ok: false, reason: 'Upload path is required.' }
  }

  const { data, error } = await adminClient
    .from('conversations')
    .select('id')
    .eq('id', conversationId)
    .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
    .maybeSingle()

  if (error) {
    console.error('[secure-upload] message attachment scope check failed:', error)
    return { ok: false, reason: 'Could not validate message attachment scope.' }
  }

  if (!data) {
    return { ok: false, reason: 'Message attachments must stay inside one of your conversations.' }
  }

  return { ok: true }
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
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
    )

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const formData = await req.formData()
    const bucket = String(formData.get('bucket') || '')
    const desiredPath = String(formData.get('path') || '')
    const file = formData.get('file')
    const policy = getUploadPolicy(bucket)

    if (!policy) {
      return new Response(JSON.stringify({ error: 'Uploads are not allowed for this bucket.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'Missing upload file.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || null
    const windowStart = new Date(Date.now() - policy.rateLimit.windowMs).toISOString()
    const { count: recentAttemptCount } = await adminClient
      .from('upload_audit_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('bucket', bucket)
      .gte('created_at', windowStart)

    if (isUploadRateLimited(bucket, recentAttemptCount ?? 0)) {
      await logUploadEvent(adminClient, {
        user_id: user.id,
        bucket,
        file_name: file.name,
        mime_type: file.type || 'application/octet-stream',
        file_size: file.size,
        status: 'rate_limited',
        reason: 'too_many_recent_upload_attempts',
        ip_address: ipAddress,
      })

      return new Response(JSON.stringify({ error: 'Too many upload attempts. Please try again later.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const bytes = new Uint8Array(await file.arrayBuffer())
    const validation = validateUploadPayload({
      bucket,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      bytes,
    })

    const messageAttachmentScope = bucket === 'message_attachments'
      ? await validateMessageAttachmentScope(adminClient, user.id, desiredPath)
      : { ok: true as const }

    const sanitizedPath = sanitizeStoragePath({
      bucket,
      userId: user.id,
      desiredPath,
      fileName: file.name,
    })

    if (!validation.ok || !messageAttachmentScope.ok || !sanitizedPath.ok) {
      const reason = validation.reason || messageAttachmentScope.reason || sanitizedPath.reason || 'upload_validation_failed'
      await logUploadEvent(adminClient, {
        user_id: user.id,
        bucket,
        file_name: file.name,
        storage_path: desiredPath,
        mime_type: file.type || 'application/octet-stream',
        file_size: file.size,
        status: 'rejected',
        reason,
        ip_address: ipAddress,
      })

      return new Response(JSON.stringify({ error: reason }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data, error: uploadError } = await adminClient.storage
      .from(bucket)
      .upload(sanitizedPath.path!, bytes, {
        upsert: policy.upsert,
        contentType: file.type || 'application/octet-stream',
      })

    if (uploadError) {
      await logUploadEvent(adminClient, {
        user_id: user.id,
        bucket,
        file_name: file.name,
        storage_path: sanitizedPath.path,
        mime_type: file.type || 'application/octet-stream',
        file_size: file.size,
        status: 'failed',
        reason: uploadError.message,
        ip_address: ipAddress,
      })

      return new Response(JSON.stringify({ error: uploadError.message || 'Upload failed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const publicUrl = policy.publicUrl
      ? adminClient.storage.from(bucket).getPublicUrl(data.path).data.publicUrl
      : null

    await logUploadEvent(adminClient, {
      user_id: user.id,
      bucket,
      file_name: file.name,
      storage_path: data.path,
      mime_type: file.type || 'application/octet-stream',
      file_size: file.size,
      status: 'accepted',
      reason: null,
      ip_address: ipAddress,
    })

    return new Response(JSON.stringify({
      bucket,
      path: data.path,
      publicUrl,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[secure-upload] error:', error)

    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

