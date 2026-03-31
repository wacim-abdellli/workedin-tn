const fs = require('fs');
const file = 'src/lib/email.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace sendEmail implementation
const newSendEmail = `
// Internal helper function with retry logic and audit trail
async function sendEmail(to: string, subject: string, html: string, type: string = 'general', contractId?: string): Promise<void> {
    try {
        // 1. Audit Log: Create entry
        const { data: auditLog } = await supabase
            .from('notification_audit_log')
            .insert({
                type,
                recipient_email: to,
                subject,
                html_body: html,
                status: 'pending',
                contract_id: contractId || null
            })
            .select()
            .single();

        let logId = auditLog?.id;
        let attempt = 0;
        const maxRetries = 3;

        // 2. Retry Queue Logic
        while (attempt < maxRetries) {
            try {
                const { error } = await supabase.functions.invoke('send-email', {       
                    body: { to, subject, html },
                });
                
                if (error) throw new Error(error.message);
                
                // Success: Update audit log
                if (logId) {
                    await supabase.from('notification_audit_log').update({
                        status: 'sent',
                        updated_at: new Date().toISOString()
                    }).eq('id', logId);
                }
                return; // Sent successfully
            } catch (err) {
                attempt++;
                console.warn(\`[email] attempt \${attempt} failed:\`, err);
                
                if (attempt >= maxRetries) {
                    // Final failure: Update audit log
                    if (logId) {
                        await supabase.from('notification_audit_log').update({
                            status: 'failed',
                            error_message: String(err),
                            retry_count: attempt,
                            updated_at: new Date().toISOString()
                        }).eq('id', logId);
                    }
                    console.error('[email] final send failed:', err);
                    return;
                }
                
                // Exponential backoff: 1s, 2s, 4s...
                await new Promise(res => setTimeout(res, 1000 * Math.pow(2, attempt - 1)));
            }
        }
    } catch (err) {
        console.error('[email] audit system error:', err);
    }
}
`;

content = content.replace(
    /async function sendEmail[\s\S]*?\}\n\}/,
    newSendEmail.trim()
);

// Update sendProposalAcceptedEmail
content = content.replace(
    /await sendEmail\(\s*freelancerEmail,\s*\`تم قبول عرضك على "\$\{jobTitle\}" — خدمة\`,\s*\`[\s\S]*?\`,\s*\);/,
    `await sendEmail(
        freelancerEmail,
        \`تم قبول عرضك على "\${jobTitle}" — خدمة\`,
        \`
        <div dir="rtl" style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
            <h2 style="color:#7c3aed">مبروك \${freelancerName}! 🎉</h2>   
            <p>تم قبول عرضك على المهمة: <strong>\${jobTitle}</strong></p>
            <p>يمكنك الآن الاطلاع على تفاصيل العقد والبدء في العمل.</p>
            <a href="https://khedma-tn.vercel.app/contracts/\${contractId}"      
               style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">
                عرض العقد
            </a>
            <p style="color:#888;margin-top:24px;font-size:12px">فريق خدمة</p>
        </div>
        \`,
        'proposal_accepted',
        contractId
    );`
);

// Update sendPaymentReceivedEmail
content = content.replace(
    /await sendEmail\(\s*freelancerEmail,\s*\`تم استلام دفعة \$\{amount\} د\.ت — خدمة\`,\s*\`[\s\S]*?\`,\s*\);/,
    `await sendEmail(
        freelancerEmail,
        \`تم استلام دفعة \${amount} د.ت — خدمة\`,
        \`
        <div dir="rtl" style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
            <h2 style="color:#059669">تم استلام دفعتك 💰</h2>    
            <p>مرحباً \${freelancerName}،</p>
            <p>تم إضافة <strong>\${amount} د.ت</strong> إلى محفظتك.</p>
            <a href="https://khedma-tn.vercel.app/contracts/\${contractId}"      
               style="display:inline-block;background:#059669;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">
                عرض العقد
            </a>
            <a href="https://khedma-tn.vercel.app/wallet"
               style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;margin-right:8px">
                عرض المحفظة
            </a>
            <p style="color:#888;margin-top:24px;font-size:12px">فريق خدمة</p>
        </div>
        \`,
        'payment_received',
        contractId
    );`
);

// Update sendNewProposalEmail
content = content.replace(
    /await sendEmail\(\s*clientEmail,\s*\`عرض جديد على مهمتك "\$\{jobTitle\}" — خدمة\`,\s*\`[\s\S]*?\`,\s*\);/,
    `await sendEmail(
        clientEmail,
        \`عرض جديد على مهمتك "\${jobTitle}" — خدمة\`,
        \`
        <div dir="rtl" style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
            <h2 style="color:#7c3aed">لديك عرض جديد!</h2>
            <p>مرحباً \${clientName}،</p>
            <p>تلقيت عرضاً جديداً على مهمتك: <strong>\${jobTitle}</strong></p>
            <a href="https://khedma-tn.vercel.app/jobs/\${jobId}"
               style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">
                عرض العروض
            </a>
            <p style="color:#888;margin-top:24px;font-size:12px">فريق خدمة</p>
        </div>
        \`,
        'new_proposal'
    );`
);

// Update sendDisputeOpenedEmail
content = content.replace(
    /await sendEmail\(\s*recipientEmail,\s*\`تم فتح نزاع على عقدك — خدمة\`,\s*\`[\s\S]*?\`,\s*\);/,
    `await sendEmail(
        recipientEmail,
        \`تم فتح نزاع على عقدك — خدمة\`,
        \`
        <div dir="rtl" style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
            <h2 style="color:#d97706">تنبيه: تم فتح نزاع ⚠️</h2>
            <p>مرحباً \${recipientName}،</p>
            <p>قام <strong>\${opener}</strong> بفتح نزاع على العقد. سيقوم فريق خدمة بمراجعة الحالة خلال 48 ساعة.</p>
            <p><strong>سبب النزاع:</strong> \${reason}</p>
            <a href="https://khedma-tn.vercel.app/contracts/\${contractId}"      
               style="display:inline-block;background:#d97706;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">
                عرض العقد
            </a>
            <p style="color:#888;margin-top:24px;font-size:12px">فريق خدمة — disputes@khedma.tn</p>
        </div>
        \`,
        'dispute_opened',
        contractId
    );`
);

fs.writeFileSync(file, content);
console.log('Fixed email retry logic');