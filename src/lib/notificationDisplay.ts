import type { AppNotification } from '@/hooks/useRealtimeNotifications';

type Tx = (key: string, params?: Record<string, string | number>, fallback?: string) => string;

const submittedMatchers = [
    'تم استلام طلب التوثيق',
    'identity verification request received',
    'demande de verification recue',
];

const approvedMatchers = [
    'your identity has been verified',
    'تم قبول توثيق هويتك',
    'votre identite a ete verifiee',
];

const rejectedMatchers = [
    'identity verification request rejected',
    'تم رفض طلب توثيق الهوية',
    'demande de verification rejetee',
];

const messageMatchers = [
    'رسالة جديدة من',
    'new message from',
    'nouveau message de',
];

function includesAny(value: string, needles: string[]) {
    const normalized = value.toLowerCase();
    return needles.some((needle) => normalized.includes(needle));
}

function extractSenderName(title: string): string {
    // Extract name from "رسالة جديدة من XYZ" or "New message from XYZ"
    const patterns = [
        /رسالة جديدة من\s+(.+)$/,
        /new message from\s+(.+)$/i,
        /nouveau message de\s+(.+)$/i,
    ];
    
    for (const pattern of patterns) {
        const match = title.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    
    return '';
}

export function getDisplayNotification(notification: AppNotification, tx: Tx): AppNotification {
    const haystack = `${notification.title} ${notification.body}`;

    // Handle message notifications
    if (notification.type === 'message' && includesAny(haystack, messageMatchers)) {
        const senderName = extractSenderName(notification.title);
        
        // Check if message was deleted - backend sets body to "Message deleted" when soft-deleted
        const isMessageDeleted = notification.body === 'Message deleted' || 
                                 notification.body.toLowerCase().includes('message deleted');
        
        return {
            ...notification,
            title: tx('notifications.message.title', { sender: senderName }, `New message from ${senderName}`),
            body: isMessageDeleted 
                ? tx('notifications.message.deleted', undefined, 'This message has been deleted')
                : notification.body, // Keep the message preview for active messages
        };
    }

    if (notification.type === 'system' && includesAny(haystack, submittedMatchers)) {
        return {
            ...notification,
            title: tx('verifyIdentity.submitted.title', undefined, 'Your request has been received successfully'),
            body: tx('verifyIdentity.pending.description', undefined, 'Your identity verification request has been received successfully. Our team is reviewing your documents.'),
        };
    }

    if (notification.type === 'system' && includesAny(haystack, approvedMatchers)) {
        return {
            ...notification,
            title: tx('verifyIdentity.verified.title', undefined, 'Your identity has been verified successfully'),
            body: tx('verifyIdentity.verified.description', undefined, 'Your account is now verified and you received the blue verification badge. You can now enjoy all platform features.'),
        };
    }

    if (notification.type === 'system' && includesAny(haystack, rejectedMatchers)) {
        return {
            ...notification,
            title: tx('notifications.identity.rejected.title', undefined, 'Identity verification request rejected'),
            body: tx('notifications.identity.rejected.body', undefined, 'Your identity verification request was rejected. Please make sure the images are clear and submit again.'),
        };
    }

    return notification;
}
