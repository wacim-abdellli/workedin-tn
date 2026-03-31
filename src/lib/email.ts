/**
 * Email notification helper — calls the send-email Edge Function.
 * Only fires in production; silently skips in dev to avoid noise.
 * Never throws — email failure must never break the main flow.
 */
import { supabase } from './supabase';

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
        const { error } = await supabase.functions.invoke('send-email', {
            body: { to, subject, html },
        });
        if (error) console.warn('[email] send failed:', error.message);
    } catch (err) {
        console.warn('[email] send error:', err);
    }
}

export async function sendProposalAcceptedEmail(
    freelancerEmail: string,
    freelancerName: string,
    jobTitle: string,
    contractId: string,
): Promise<void> {
    await sendEmail(
        freelancerEmail,
        `تم قبول عرضك على "${jobTitle}" — خدمة`,
        `
        <div dir="rtl" style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
            <h2 style="color:#7c3aed">مبروك ${freelancerName}! 🎉</h2>   
            <p>تم قبول عرضك على المهمة: <strong>${jobTitle}</strong></p>
            <p>يمكنك الآن الاطلاع على تفاصيل العقد والبدء في العمل.</p>
            <a href="https://khedma-tn.vercel.app/contracts/${contractId}"      
               style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">
                عرض العقد
            </a>
            <p style="color:#888;margin-top:24px;font-size:12px">فريق خدمة</p>
        </div>
        `,
        'proposal_accepted',
        contractId
    );
}

export async function sendPaymentReceivedEmail(
    freelancerEmail: string,
    freelancerName: string,
    amount: number,
    contractId: string,
): Promise<void> {
    await sendEmail(
        freelancerEmail,
        `تم استلام دفعة ${amount} د.ت — خدمة`,
        `
        <div dir="rtl" style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
            <h2 style="color:#059669">تم استلام دفعتك 💰</h2>    
            <p>مرحباً ${freelancerName}،</p>
            <p>تم إضافة <strong>${amount} د.ت</strong> إلى محفظتك.</p>
            <a href="https://khedma-tn.vercel.app/contracts/${contractId}"      
               style="display:inline-block;background:#059669;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">
                عرض العقد
            </a>
            <a href="https://khedma-tn.vercel.app/wallet"
               style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px;margin-right:8px">
                عرض المحفظة
            </a>
            <p style="color:#888;margin-top:24px;font-size:12px">فريق خدمة</p>
        </div>
        `,
        'payment_received',
        contractId
    );
}

export async function sendNewProposalEmail(
    clientEmail: string,
    clientName: string,
    jobTitle: string,
    jobId: string,
): Promise<void> {
    await sendEmail(
        clientEmail,
        `عرض جديد على مهمتك "${jobTitle}" — خدمة`,
        `
        <div dir="rtl" style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
            <h2 style="color:#7c3aed">لديك عرض جديد!</h2>
            <p>مرحباً ${clientName}،</p>
            <p>تلقيت عرضاً جديداً على مهمتك: <strong>${jobTitle}</strong></p>
            <a href="https://khedma-tn.vercel.app/jobs/${jobId}"
               style="display:inline-block;background:#7c3aed;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">
                عرض العروض
            </a>
            <p style="color:#888;margin-top:24px;font-size:12px">فريق خدمة</p>
        </div>
        `,
        'new_proposal'
    );
}

export async function sendDisputeOpenedEmail(
    recipientEmail: string,
    recipientName: string,
    contractId: string,
    openedByRole: 'client' | 'freelancer',
    reason: string,
): Promise<void> {
    const opener = openedByRole === 'client' ? 'العميل' : 'المستقل';
    await sendEmail(
        recipientEmail,
        `تم فتح نزاع على عقدك — خدمة`,
        `
        <div dir="rtl" style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
            <h2 style="color:#d97706">تنبيه: تم فتح نزاع ⚠️</h2>
            <p>مرحباً ${recipientName}،</p>
            <p>قام <strong>${opener}</strong> بفتح نزاع على العقد. سيقوم فريق خدمة بمراجعة الحالة خلال 48 ساعة.</p>
            <p><strong>سبب النزاع:</strong> ${reason}</p>
            <a href="https://khedma-tn.vercel.app/contracts/${contractId}"      
               style="display:inline-block;background:#d97706;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:16px">
                عرض العقد
            </a>
            <p style="color:#888;margin-top:24px;font-size:12px">فريق خدمة — disputes@khedma.tn</p>
        </div>
        `,
        'dispute_opened',
        contractId
    );
}
