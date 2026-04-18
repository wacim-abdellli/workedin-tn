import type { AppNotification } from '@/hooks/useRealtimeNotifications';

type Tx = (key: string, params?: Record<string, string | number>, fallback?: string) => string;

function includesAny(value: string, needles: string[]) {
    const normalized = value.toLowerCase();
    return needles.some((needle) => normalized.includes(needle));
}

function extractMatch(value: string, patterns: RegExp[]): string {
    for (const pattern of patterns) {
        const match = value.match(pattern);
        if (match && match[1]) return match[1].trim();
    }
    return '';
}

export function getDisplayNotification(notification: AppNotification, tx: Tx): AppNotification {
    const title = notification.title || '';
    const body = notification.body || '';
    const haystack = `${title} ${body}`;

    // 1. Identity Verification
    if (notification.type === 'system') {
        if (includesAny(haystack, ['تم استلام طلب التوثيق', 'identity verification request received'])) {
            return {
                ...notification,
                title: tx('notifications.identity.submitted.title', undefined, 'Verification request received'),
                body: tx('notifications.identity.submitted.body', undefined, 'Your identity verification request has been received. Our team is reviewing your documents.'),
            };
        }
        if (includesAny(haystack, ['your identity has been verified', 'تم قبول توثيق هويتك'])) {
            return {
                ...notification,
                title: tx('notifications.identity.verified.title', undefined, 'Identity verified successfully'),
                body: tx('notifications.identity.verified.body', undefined, 'Your account is now verified. You received the verification badge.'),
            };
        }
        if (includesAny(haystack, ['identity verification request rejected', 'تم رفض طلب توثيق الهوية'])) {
            return {
                ...notification,
                title: tx('notifications.identity.rejected.title', undefined, 'Identity verification rejected'),
                body: tx('notifications.identity.rejected.body', undefined, 'Your identity verification request was rejected. Please submit clear documents.'),
            };
        }
    }

    // 2. Direct Messages
    if (notification.type === 'message' && includesAny(haystack, ['رسالة جديدة من', 'new message from', 'nouveau message de'])) {
        const senderName = extractMatch(title, [
            /رسالة جديدة من\s+(.+)$/,
            /new message from\s+(.+)$/i,
            /nouveau message de\s+(.+)$/i,
        ]);
        const isDeleted = includesAny(body, ['message deleted']);
        
        return {
            ...notification,
            title: tx('notifications.message.title', { sender: senderName }, `New message from ${senderName}`),
            body: isDeleted 
                ? tx('notifications.message.deleted', undefined, 'This message has been deleted')
                : body,
        };
    }

    // 3. Proposal Accepted (Client to Freelancer)
    // "تم قبول العرض"
    if (notification.type === 'proposal' && includesAny(haystack, ['تم قبول العرض', 'proposal accepted'])) {
        const jobTitle = extractMatch(body, [
            /(.+?)\s+تم قبول عرضك على المشروع/,
            /(.+?)\s+proposal accepted/i
        ]) || 'your project';

        return {
            ...notification,
            title: tx('notifications.proposal.accepted.title', undefined, 'Proposal Accepted'),
            body: tx('notifications.proposal.accepted.body', { jobTitle }, `Your proposal on '${jobTitle}' was accepted!`),
        };
    }

    // 4. New Proposal (Freelancer to Client)
    // "عرض جديد على وظيفتك" -> "Freelancer قدّم عرضاً على JobTitle"
    if (notification.type === 'proposal' && includesAny(haystack, ['عرض جديد على وظيفتك', 'new proposal'])) {
        const matchAr = body.match(/(.+?)\s+قدّم عرضاً على\s+"(.+?)"/);
        const freelancerName = matchAr ? matchAr[1] : 'A freelancer';
        const jobTitle = matchAr ? matchAr[2] : 'your project';

        return {
            ...notification,
            title: tx('notifications.proposal.new.title', undefined, 'New Proposal Received'),
            body: tx('notifications.proposal.new.body', { freelancer: freelancerName, jobTitle }, `${freelancerName} submitted a proposal on '${jobTitle}'`),
        };
    }

    // 5. Contract Updates
    if (notification.type === 'contract') {
        if (includesAny(title, ['تم قبول العقد'])) {
            return {
                ...notification,
                title: tx('notifications.contract.active.title', undefined, 'Contract Started'),
                body: tx('notifications.contract.active.body', { body }, body),
            };
        }
        if (includesAny(title, ['تم إكمال العقد'])) {
            return {
                ...notification,
                title: tx('notifications.contract.completed.title', undefined, 'Contract Completed'),
                body: tx('notifications.contract.completed.body', { body }, body),
            };
        }
        if (includesAny(title, ['تم إلغاء العقد'])) {
            return {
                ...notification,
                title: tx('notifications.contract.cancelled.title', undefined, 'Contract Cancelled'),
                body: tx('notifications.contract.cancelled.body', { body }, body),
            };
        }
        if (includesAny(title, ['نزاع على العقد'])) {
            return {
                ...notification,
                title: tx('notifications.contract.disputed.title', undefined, 'Contract in Dispute'),
                body: tx('notifications.contract.disputed.body', { body }, body),
            };
        }
        // Generic contract update
        if (includesAny(title, ['تحديث على العقد'])) {
            return {
                ...notification,
                title: tx('notifications.contract.update.title', undefined, 'Contract Update'),
                body: tx('notifications.contract.update.body', { body }, body),
            };
        }
    }

    return notification;
}
