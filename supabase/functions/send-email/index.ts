// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'npm:resend@2.0.0'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

serve(async (req) => {
    const { to, subject, html } = await req.json()

    try {
        const data = await resend.emails.send({
            from: 'Khedma <noreply@khedma.tn>',
            to,
            subject,
            html,
        })

        return new Response(JSON.stringify(data), {
            headers: { 'Content-Type': 'application/json' },
        })
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        })
    }
})
