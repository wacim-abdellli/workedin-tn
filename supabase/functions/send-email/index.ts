/**
 * Supabase Edge Function: Send Email via Resend
 *
 * SECURITY:
 * - Requires authenticated user
 * - CORS restricted to production domain
 * - Input validation on all fields
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@2.0.0'

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || 'https://khedma.tn'

const corsHeaders = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

// Simple email format validation
function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // --- AUTH CHECK ---
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL')!,
            Deno.env.get('SUPABASE_ANON_KEY')!,
            {
                global: {
                    headers: { Authorization: req.headers.get('Authorization')! }
                }
            }
        )

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // --- INPUT VALIDATION ---
        const { to, subject, html } = await req.json()

        if (!to || !subject || !html) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Validate email recipients
        const recipients = Array.isArray(to) ? to : [to]
        for (const email of recipients) {
            if (typeof email !== 'string' || !isValidEmail(email)) {
                return new Response(
                    JSON.stringify({ error: `Invalid email address: ${email}` }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }
        }

        if (typeof subject !== 'string' || subject.length > 200) {
            return new Response(
                JSON.stringify({ error: 'Subject must be a string under 200 characters' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        if (typeof html !== 'string' || html.length > 50000) {
            return new Response(
                JSON.stringify({ error: 'HTML body must be a string under 50,000 characters' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // --- SEND EMAIL ---
        console.log('[SendEmail] Sending email for user:', user.id, 'to:', recipients)

        const data = await resend.emails.send({
            from: 'Khedma <noreply@khedma.tn>',
            to: recipients,
            subject,
            html,
        })

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Internal server error'
        console.error('[SendEmail] Error:', message)
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
})
