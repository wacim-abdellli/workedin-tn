import type { AppNotification, NotificationCategory } from '@/hooks/useRealtimeNotifications';

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

function cleanBody(body: string): string {
    return body
        .replace(/\s*[—-]\s*(?:contract updated|contract update|contract started|contract completed|contract cancelled|contract in dispute|تحديث على العقد|تم قبول العقد|تم إكمال العقد|تم إلغاء العقد|نزاع على العقد)\s*$/i, '')
        .trim();
}

function determineCategory(type: AppNotification['type'], title: string, body: string): NotificationCategory {
    const haystack = `${title} ${body}`.toLowerCase();

    if (type === 'message') {
        return 'message';
    }

    if (type === 'proposal' || type === 'new_proposal') {
        if (includesAny(haystack, ['accepted', 'تم قبول العرض'])) {
            return 'proposal_accepted';
        }
        return 'proposal_new';
    }

    if (type === 'payment') {
        if (includesAny(haystack, ['released', 'إفراج', 'auto-released', 'approved'])) {
            return 'payment_released';
        }
        return 'payment_funded';
    }

    if (type === 'system') {
        if (includesAny(haystack, ['verified', 'قبول توثيق', 'توثيق هويتك', 'restored'])) {
            return 'system_verified';
        }
        if (includesAny(haystack, ['rejected', 'refused', 'suspended', 'archived', 'تعليق', 'حظر'])) {
            return 'system_rejected';
        }
        return 'system_info';
    }

    if (type === 'contract' || type === 'contract_update') {
        if (includesAny(haystack, ['payment released', 'payment auto-released', 'milestone approved and payment released', 'escrow released'])) {
            return 'payment_released';
        }
        if (includesAny(haystack, ['escrow funded', 'unpaid escrow', 'milestone funded'])) {
            return 'payment_funded';
        }
        if (includesAny(haystack, ['review due soon', 'contract review overdue', 'window expired', 'expired'])) {
            return 'contract_timeout';
        }
        if (includesAny(haystack, ['accepted', 'started', 'تم قبول العقد', 'نشط'])) {
            return 'contract_accepted';
        }
        if (includesAny(haystack, ['completed', 'تم إكمال العقد', 'إكمال'])) {
            return 'contract_completed';
        }
        if (includesAny(haystack, ['cancelled', 'تم إلغاء العقد', 'إلغاء'])) {
            return 'contract_cancelled';
        }
        if (includesAny(haystack, ['dispute', 'نزاع', 'disputed'])) {
            return 'contract_disputed';
        }
        return 'contract_update';
    }

    return 'system_info';
}

export function getDisplayNotification(notification: AppNotification, tx: Tx): AppNotification {
    const rawResult = getDisplayNotificationRaw(notification, tx);
    const category = determineCategory(rawResult.type, rawResult.title, rawResult.body);
    return {
        ...rawResult,
        category,
    };
}

function getDisplayNotificationRaw(notification: AppNotification, tx: Tx): AppNotification {
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
            /تم قبول عرضك على المشروع:\s+(.+)/,
            /proposal accepted on\s+(.+)/i
        ]) || 'your project';

        return {
            ...notification,
            title: tx('notifications.proposal.accepted.title', undefined, 'Proposal Accepted'),
            body: tx('notifications.proposal.accepted.body', { jobTitle }, `Your proposal on '${jobTitle}' was accepted!`),
        };
    }

    // 4. New Proposal (Freelancer to Client)
    if ((notification.type === 'proposal' || notification.type === 'new_proposal') && 
        includesAny(haystack, ['عرض جديد', 'new proposal'])) {
        const matchAr = body.match(/(.+?)\s*(?:قدّم عرضاً على|"submitted a proposal on")\s*(?:"|')?(.+?)(?:"|')?$/i);
        const freelancerName = matchAr ? matchAr[1].trim() : 'A freelancer';
        const jobTitle = matchAr ? matchAr[2].trim() : 'your project';

        return {
            ...notification,
            title: tx('notifications.proposal.new.title', undefined, 'New Proposal Received'),
            body: tx('notifications.proposal.new.body', { freelancer: freelancerName, jobTitle }, `${freelancerName} submitted a proposal on '${jobTitle}'`),
        };
    }

    // 5. Contract Updates
    if (notification.type === 'contract' || notification.type === 'contract_update') {
        const cleanText = cleanBody(body);
        if (includesAny(title, ['تم قبول العقد', 'contract started', 'contract accepted'])) {
            return {
                ...notification,
                title: tx('notifications.contract.active.title', undefined, 'Contract Started'),
                body: tx('notifications.contract.active.body', { body: cleanText }, cleanText),
            };
        }
        if (includesAny(title, ['تم إكمال العقد', 'contract completed'])) {
            return {
                ...notification,
                title: tx('notifications.contract.completed.title', undefined, 'Contract Completed'),
                body: tx('notifications.contract.completed.body', { body: cleanText }, cleanText),
            };
        }
        if (includesAny(title, ['تم إلغاء العقد', 'contract cancelled'])) {
            return {
                ...notification,
                title: tx('notifications.contract.cancelled.title', undefined, 'Contract Cancelled'),
                body: tx('notifications.contract.cancelled.body', { body: cleanText }, cleanText),
            };
        }
        if (includesAny(title, ['نزاع على العقد', 'contract in dispute', 'contract dispute'])) {
            return {
                ...notification,
                title: tx('notifications.contract.disputed.title', undefined, 'Contract in Dispute'),
                body: tx('notifications.contract.disputed.body', { body: cleanText }, cleanText),
            };
        }
        // Generic contract update
        if (includesAny(title, ['تحديث على العقد', 'contract updated', 'contract update'])) {
            return {
                ...notification,
                title: tx('notifications.contract.update.title', undefined, 'Contract Update'),
                body: tx('notifications.contract.update.body', { body: cleanText }, cleanText),
            };
        }
    }

    return notification;
}
