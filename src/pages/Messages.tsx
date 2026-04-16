import { useState, useEffect, useRef, useCallback, useMemo, type CSSProperties } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
    Search,
    Send,
    Paperclip,
    Trash2,
    ArrowLeft,
    FileText,
    Loader2,
    Mic,
    Square,
    X,
    FileAudio,
    Clock,
    Play,
    Pause,
    AlertCircle,
    MoreVertical,
    CheckCheck,
    CornerUpLeft,
    Download,
    Image as ImageIcon,
    User,
    Mail,
    Flag,
} from 'lucide-react';
import { Header } from '../components/layout';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import SEO, { SEO_CONFIG } from '../components/common/SEO';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import {
    getConversations,
    getMessages,
    deleteMessage,
    sendMessage,
    uploadMessageAttachment,
    markConversationRead,
    subscribeToConversation,
    subscribeToConversations,
    type ConversationScope,
    type Conversation,
    type Message,
} from '../services/messages';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useTypingIndicator } from '../hooks/useTypingIndicator';
import { useReadReceipts } from '../hooks/useReadReceipts';
import { useTranslation } from '../i18n';
import ErrorBoundary from '../components/ErrorBoundary';
import { validateUploadSelection } from '../lib/uploadPolicy';
import {
    normalizeContractStatus,
    resolveMessagingLifecyclePolicy,
    type ContractMessagingStatus,
    type MessagingPolicyTone,
} from '../lib/messagingLifecycle';

// Helper functions for offline file handling
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const base64ToFile = (base64: string, filename: string, mimeType: string): File => {
    const arr = base64.split(',');
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mimeType });
};

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

const normalizeMimeType = (mimeType: string | null | undefined) => (
    (mimeType || '').split(';')[0].trim().toLowerCase()
);

const canonicalizeVoiceMimeType = (mimeType: string | null | undefined) => {
    const normalized = normalizeMimeType(mimeType);

    if (!normalized) return 'audio/webm';

    if (normalized === 'audio/x-wav' || normalized === 'audio/wav') return 'audio/wav';
    if (['audio/mp3', 'audio/x-mp3', 'audio/x-mpeg', 'audio/mpeg'].includes(normalized)) return 'audio/mpeg';
    if (['audio/x-m4a', 'audio/m4a', 'audio/mp4a-latm', 'audio/aac', 'audio/mp4', 'video/mp4'].includes(normalized)) return 'audio/mp4';
    if (normalized === 'audio/ogg' || normalized === 'video/ogg') return 'audio/ogg';
    if (normalized === 'audio/webm' || normalized === 'video/webm') return 'audio/webm';

    return normalized.startsWith('audio/') ? normalized : 'audio/webm';
};

const getAudioExtensionFromMimeType = (mimeType: string) => {
    switch (canonicalizeVoiceMimeType(mimeType)) {
        case 'audio/mp4':
            return 'm4a';
        case 'audio/mpeg':
            return 'mp3';
        case 'audio/wav':
        case 'audio/x-wav':
            return 'wav';
        case 'audio/ogg':
            return 'ogg';
        case 'audio/webm':
        default:
            return 'webm';
    }
};

const buildVoiceMemoFile = (audio: Blob, timestamp: number = Date.now()) => {
    const canonicalMimeType = canonicalizeVoiceMimeType(audio.type);
    const extension = getAudioExtensionFromMimeType(canonicalMimeType);
    const fileName = `voice_memo_${timestamp}.${extension}`;

    return {
        fileName,
        mimeType: canonicalMimeType,
        file: new File([audio], fileName, { type: canonicalMimeType }),
    };
};

const MESSAGE_ATTACHMENT_ACCEPT = [
    'image/*',
    'application/pdf',
    'audio/webm',
    'audio/mp4',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'video/webm',
    'video/mp4',
    '.doc',
    '.docx',
    '.txt',
    '.gif',
    '.m4a',
    '.mp3',
    '.wav',
    '.ogg',
    '.mp4',
    '.webm',
].join(',');

const extractMessageAttachmentPath = (value: string | null | undefined): string | null => {
    const raw = String(value || '').trim();
    if (!raw) return null;

    if (!/^(https?:)/i.test(raw)) {
        const normalized = raw.replace(/^\/+/, '');
        const withoutPublicPrefix = normalized.replace(/^storage\/v1\/object\/public\/message_attachments\//i, '');
        const objectPath = withoutPublicPrefix.startsWith('message_attachments/')
            ? withoutPublicPrefix.slice('message_attachments/'.length)
            : withoutPublicPrefix;
        return objectPath || null;
    }

    try {
        const parsed = new URL(raw);
        const decodedPath = decodeURIComponent(parsed.pathname);
        const marker = '/message_attachments/';
        const markerIndex = decodedPath.indexOf(marker);
        if (markerIndex === -1) return null;

        const candidate = decodedPath.slice(markerIndex + marker.length);
        return candidate || null;
    } catch {
        return null;
    }
};

const hasSignature = (bytes: Uint8Array, signature: number[], offset = 0) => {
    if (bytes.length < offset + signature.length) return false;
    return signature.every((value, index) => bytes[offset + index] === value);
};

const detectAudioMimeTypeFromBuffer = (buffer: ArrayBuffer): string | null => {
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 4) return null;

    if (hasSignature(bytes, [0x1a, 0x45, 0xdf, 0xa3])) return 'audio/webm';
    if (hasSignature(bytes, [0x52, 0x49, 0x46, 0x46]) && hasSignature(bytes, [0x57, 0x41, 0x56, 0x45], 8)) return 'audio/wav';
    if (hasSignature(bytes, [0x4f, 0x67, 0x67, 0x53])) return 'audio/ogg';
    if (hasSignature(bytes, [0x49, 0x44, 0x33]) || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)) return 'audio/mpeg';
    if (hasSignature(bytes, [0x66, 0x74, 0x79, 0x70], 4)) return 'audio/mp4';

    return null;
};

const inferAudioMimeType = (mimeType: string | null | undefined, fileName: string | null | undefined) => {
    const normalized = normalizeMimeType(mimeType);
    if (normalized.startsWith('audio/')) return normalized;

    const lowerName = String(fileName || '').toLowerCase();
    if (lowerName.endsWith('.mp3')) return 'audio/mpeg';
    if (lowerName.endsWith('.wav')) return 'audio/wav';
    if (lowerName.endsWith('.ogg')) return 'audio/ogg';
    if (lowerName.endsWith('.m4a')) return 'audio/mp4';
    return 'audio/webm';
};

const formatAudioTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
};

type MessageAttachment = NonNullable<Message['attachments']>[number];

const isImageAttachment = (attachment: MessageAttachment) =>
    attachment.type?.startsWith('image/') || /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(attachment.name || '');

const isAudioAttachment = (attachment: MessageAttachment) =>
    attachment.type?.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|webm)$/i.test(attachment.name || '');

const formatAttachmentSize = (size: string | number | null | undefined) => {
    const parsedSize = typeof size === 'string' ? Number(size) : size;
    if (!Number.isFinite(parsedSize) || !parsedSize || parsedSize <= 0) return null;
    if (parsedSize < 1024) return `${parsedSize} B`;
    if (parsedSize < 1024 * 1024) return `${(parsedSize / 1024).toFixed(1)} KB`;
    return `${(parsedSize / (1024 * 1024)).toFixed(1)} MB`;
};

const getAttachmentExtensionLabel = (name: string | null | undefined, mimeType: string | null | undefined) => {
    const rawName = String(name || '').trim();
    if (rawName.includes('.')) {
        const ext = rawName.split('.').pop();
        if (ext) return ext.toUpperCase();
    }

    const normalizedMimeType = normalizeMimeType(mimeType);
    if (normalizedMimeType.includes('/')) {
        return normalizedMimeType.split('/')[1]?.toUpperCase() || 'FILE';
    }

    return 'FILE';
};

type MessageAudioPlayerProps = {
    src: string;
    rawSource?: string;
    name: string;
    mimeType?: string;
    isOwn: boolean;
};

function MessageAudioPlayer({ src, rawSource, name, mimeType, isOwn }: MessageAudioPlayerProps) {
    const { tx } = useTranslation();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const fallbackObjectUrlRef = useRef<string | null>(null);
    const didAttemptBlobFallbackRef = useRef(false);

    const [playbackSrc, setPlaybackSrc] = useState(src);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);

    const waveformBars = useMemo(() => (
        Array.from({ length: 18 }, (_, index) => {
            const seeded = Math.sin((index + 1.8) * 1.57) * 0.5 + 0.5;
            return 6 + Math.round(seeded * 13);
        })
    ), []);

    const progressRatio = duration > 0 ? Math.min(currentTime / duration, 1) : 0;
    const defaultDuration = duration > 0 ? duration : 14;

    const displayAudioName = useMemo(() => {
        const rawName = String(name || '').trim();
        if (!rawName) return tx('pages.messages.voiceMemo', undefined, 'Audio note');

        const lowerName = rawName.toLowerCase();
        if (
            lowerName.includes('voice memo')
            || lowerName.includes('voice_memo')
            || lowerName.includes('message vocal')
            || rawName.includes('رسالة صوتية')
        ) {
            return tx('pages.messages.voiceMemo', undefined, 'Audio note');
        }

        return rawName;
    }, [name, tx]);

    useEffect(() => {
        setPlaybackSrc(src);
        setIsPlaying(false);
        setDuration(0);
        setCurrentTime(0);
        setIsLoading(false);
        setHasError(false);
        didAttemptBlobFallbackRef.current = false;

        if (fallbackObjectUrlRef.current) {
            URL.revokeObjectURL(fallbackObjectUrlRef.current);
            fallbackObjectUrlRef.current = null;
        }
    }, [src]);

    useEffect(() => {
        return () => {
            if (fallbackObjectUrlRef.current) {
                URL.revokeObjectURL(fallbackObjectUrlRef.current);
                fallbackObjectUrlRef.current = null;
            }
        };
    }, []);

    const tryBlobFallback = useCallback(async (): Promise<boolean> => {
        if (!src) {
            setHasError(true);
            return false;
        }

        let incomingBlob: Blob | null = null;

        try {
            const response = await fetch(src, { cache: 'no-store' });
            if (response.ok) {
                incomingBlob = await response.blob();
            }
        } catch {
            // fallback below
        }

        if (!incomingBlob) {
            const attachmentPath = extractMessageAttachmentPath(rawSource || src);
            if (attachmentPath) {
                const { data, error } = await supabase.storage
                    .from('message_attachments')
                    .download(attachmentPath);

                if (!error && data) {
                    incomingBlob = data;
                }
            }
        }

        if (!incomingBlob) {
            setHasError(true);
            return false;
        }

        const buffer = await incomingBlob.arrayBuffer();
        const detectedMimeType = detectAudioMimeTypeFromBuffer(buffer);
        const effectiveMimeType = detectedMimeType || inferAudioMimeType(mimeType || incomingBlob.type, name);
        const normalizedBlob = new Blob([buffer], { type: effectiveMimeType });

        if (fallbackObjectUrlRef.current) {
            URL.revokeObjectURL(fallbackObjectUrlRef.current);
            fallbackObjectUrlRef.current = null;
        }

        const objectUrl = URL.createObjectURL(normalizedBlob);
        fallbackObjectUrlRef.current = objectUrl;

        setPlaybackSrc(objectUrl);
        setHasError(false);
        return true;
    }, [mimeType, name, rawSource, src]);

    const togglePlay = async () => {
        const player = audioRef.current;
        if (!player || hasError) return;

        try {
            if (player.paused) {
                setIsLoading(true);
                await player.play();
                setIsPlaying(true);
            } else {
                player.pause();
                setIsPlaying(false);
            }
        } catch {
            if (!didAttemptBlobFallbackRef.current) {
                didAttemptBlobFallbackRef.current = true;
                const recovered = await tryBlobFallback();
                if (recovered) {
                    setIsPlaying(false);
                    return;
                }
            }

            setHasError(true);
            setIsPlaying(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAudioError = () => {
        if (didAttemptBlobFallbackRef.current) {
            setHasError(true);
            setIsPlaying(false);
            setIsLoading(false);
            return;
        }

        didAttemptBlobFallbackRef.current = true;
        void tryBlobFallback();
    };

    const playedBars = Math.round(progressRatio * waveformBars.length);

    return (
        <div className="min-w-[200px]">
            <audio
                ref={audioRef}
                src={playbackSrc}
                preload="metadata"
                onLoadedMetadata={(event) => {
                    setDuration(event.currentTarget.duration || 0);
                    setHasError(false);
                }}
                onTimeUpdate={(event) => {
                    setCurrentTime(event.currentTarget.currentTime || 0);
                }}
                onPlay={() => {
                    setIsPlaying(true);
                    setIsLoading(false);
                }}
                onPause={() => {
                    setIsPlaying(false);
                    setIsLoading(false);
                }}
                onEnded={() => {
                    setIsPlaying(false);
                    setCurrentTime(duration || 0);
                }}
                onError={handleAudioError}
            />

            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => {
                        void togglePlay();
                    }}
                    disabled={hasError}
                    aria-label={`${isPlaying ? tx('pages.messages.pauseAudio', undefined, 'Pause audio') : tx('pages.messages.playAudio', undefined, 'Play audio')} ${displayAudioName}`}
                    className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center transition-colors disabled:opacity-50 ${
                        isOwn
                            ? 'bg-white text-purple-600 hover:bg-gray-100'
                            : 'bg-purple-500 text-white hover:bg-purple-400'
                    }`}
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isPlaying ? (
                        <Pause className="h-4 w-4" />
                    ) : (
                        <Play className="h-4 w-4" />
                    )}
                </button>

                <div className="flex gap-0.5 items-center flex-1 h-6" role="presentation">
                    {waveformBars.map((barHeight, index) => {
                        const isActiveBar = index < playedBars;
                        return (
                            <div
                                key={index}
                                className={`w-1 rounded-full transition-colors ${
                                    isOwn
                                        ? (isActiveBar ? 'bg-purple-200' : 'bg-purple-300')
                                        : (isActiveBar ? 'bg-gray-400' : 'bg-gray-500')
                                }`}
                                style={{ height: `${barHeight}px` }}
                            />
                        );
                    })}
                </div>

                <span className={`text-[10px] font-medium tracking-wide shrink-0 ${isOwn ? 'text-purple-100' : 'text-gray-400'}`}>
                    {formatAudioTime(defaultDuration)}
                </span>
            </div>

            {hasError ? (
                <div className={`mt-1 flex items-center gap-1 text-[10px] ${isOwn ? 'text-purple-100' : 'text-gray-400'}`}>
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{tx('pages.messages.audioPreviewUnavailable', undefined, 'Audio preview unavailable.')}</span>
                </div>
            ) : null}
        </div>
    );
}

const resolveMessageAttachmentUrl = (url: string | null | undefined) => {
    const raw = String(url || '').trim();
    if (!raw) return '';
    if (/^(https?:|blob:|data:)/i.test(raw)) return raw;

    const normalized = raw.replace(/^\/+/, '');
    const withoutPublicPrefix = normalized.replace(/^storage\/v1\/object\/public\/message_attachments\//i, '');
    const objectPath = withoutPublicPrefix.startsWith('message_attachments/')
        ? withoutPublicPrefix.slice('message_attachments/'.length)
        : withoutPublicPrefix;

    if (!objectPath) return raw;

    return supabase.storage
        .from('message_attachments')
        .getPublicUrl(objectPath)
        .data.publicUrl;
};

const openBlobAsPreviewOrDownload = (blob: Blob, fileName: string, canPreviewInTab: boolean) => {
    const objectUrl = URL.createObjectURL(blob);

    if (canPreviewInTab) {
        const openedWindow = window.open(objectUrl, '_blank', 'noopener,noreferrer');
        if (!openedWindow) {
            const link = document.createElement('a');
            link.href = objectUrl;
            link.download = fileName;
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    } else {
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = fileName;
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
    }, 60_000);
};

type ThreadMessage = Message & {
    status?: 'sending' | 'failed';
};

type ReplyMetadata = {
    messageId: string;
    senderName: string;
    previewText: string;
};

const REPLY_TOKEN_PREFIX = '[[reply:';
const REPLY_TOKEN_SUFFIX = ']]';
const MAX_REPLY_PREVIEW_LENGTH = 120;

const truncateText = (value: string, maxLength: number) => (
    value.length > maxLength ? `${value.slice(0, maxLength - 1)}...` : value
);

const parseReplyMetadataFromContent = (content: string | null | undefined) => {
    const rawContent = String(content || '');

    if (!rawContent.startsWith(REPLY_TOKEN_PREFIX)) {
        return { replyMetadata: null as ReplyMetadata | null, bodyText: rawContent };
    }

    const suffixIndex = rawContent.indexOf(REPLY_TOKEN_SUFFIX);
    if (suffixIndex <= REPLY_TOKEN_PREFIX.length) {
        return { replyMetadata: null as ReplyMetadata | null, bodyText: rawContent };
    }

    const encodedPayload = rawContent.slice(REPLY_TOKEN_PREFIX.length, suffixIndex);
    const bodyText = rawContent.slice(suffixIndex + REPLY_TOKEN_SUFFIX.length).trimStart();

    try {
        const parsedPayload = JSON.parse(decodeURIComponent(encodedPayload)) as Partial<ReplyMetadata>;
        if (
            !parsedPayload
            || typeof parsedPayload.messageId !== 'string'
            || typeof parsedPayload.senderName !== 'string'
            || typeof parsedPayload.previewText !== 'string'
        ) {
            return { replyMetadata: null as ReplyMetadata | null, bodyText: rawContent };
        }

        const replyMetadata: ReplyMetadata = {
            messageId: parsedPayload.messageId,
            senderName: truncateText(parsedPayload.senderName.trim() || 'User', 60),
            previewText: truncateText(parsedPayload.previewText.trim() || 'Attachment', MAX_REPLY_PREVIEW_LENGTH),
        };

        return { replyMetadata, bodyText };
    } catch {
        return { replyMetadata: null as ReplyMetadata | null, bodyText: rawContent };
    }
};

const serializeReplyMetadataIntoContent = (bodyText: string, replyMetadata: ReplyMetadata | null) => {
    const normalizedBody = bodyText.trim();
    if (!replyMetadata) return normalizedBody;

    const payload = encodeURIComponent(JSON.stringify({
        messageId: replyMetadata.messageId,
        senderName: truncateText(replyMetadata.senderName.trim() || 'User', 60),
        previewText: truncateText(replyMetadata.previewText.trim() || 'Attachment', MAX_REPLY_PREVIEW_LENGTH),
    }));

    return `${REPLY_TOKEN_PREFIX}${payload}${REPLY_TOKEN_SUFFIX}${normalizedBody ? ` ${normalizedBody}` : ''}`;
};

const MAX_CACHED_CONVERSATIONS = 50;
const MAX_CACHED_MESSAGES = 200;

const getConversationsCacheKey = (userId: string, modeKey: string) => `messages:conversations:${userId}:${modeKey}`;
const getMessagesCacheKey = (conversationId: string) => `messages:thread:${conversationId}`;

const resolveConversationScopes = (activeMode: string | null | undefined): ConversationScope[] => {
    if (activeMode === 'freelancer') return ['freelancer', 'contract', 'shared'];
    if (activeMode === 'client') return ['client', 'contract', 'shared'];
    return ['client', 'freelancer', 'contract', 'shared'];
};

const resolveModeCacheKey = (activeMode: string | null | undefined) => {
    if (activeMode === 'client' || activeMode === 'freelancer') return activeMode;
    return 'all';
};

const readSessionCache = <T,>(key: string): T | null => {
    try {
        const raw = sessionStorage.getItem(key);
        return raw ? JSON.parse(raw) as T : null;
    } catch {
        return null;
    }
};

const writeSessionCache = (key: string, value: unknown) => {
    try {
        sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Ignore session storage write failures.
    }
};

const sortConversationsByActivity = (items: Conversation[]) => {
    return [...items].sort(
        (a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
    );
};

const isDeletedMessage = (message: ThreadMessage | null | undefined) => Boolean(message?.is_deleted);

const normalizeComparableUrl = (value: string) => (
    value
        .trim()
        .replace(/[?#].*$/, '')
        .replace(/\/+$/, '')
);

const shouldHideAttachmentUrlText = (message: ThreadMessage | null | undefined) => {
    if (!message || isDeletedMessage(message)) return false;

    const content = parseReplyMetadataFromContent(message.content).bodyText.trim();
    if (!content || !/^https?:\/\/\S+$/i.test(content)) return false;

    const attachments = message.attachments ?? [];
    if (attachments.length === 0) return false;

    const normalizedContent = normalizeComparableUrl(content);
    return attachments.some((attachment) => {
        if (!attachment.url) return false;
        return normalizeComparableUrl(attachment.url) === normalizedContent;
    });
};

const getMessageDisplayText = (message: ThreadMessage | null | undefined, deletedLabel: string) => {
    if (!message) return null;
    return isDeletedMessage(message) ? deletedLabel : parseReplyMetadataFromContent(message.content).bodyText;
};

const getMessageReplyMetadata = (message: ThreadMessage | null | undefined) => {
    if (!message || isDeletedMessage(message)) return null;
    return parseReplyMetadataFromContent(message.content).replyMetadata;
};

const getThreadPreview = (threadMessages: ThreadMessage[], deletedLabel: string) => {
    const lastMessage = threadMessages[threadMessages.length - 1] ?? null;
    const rawPreviewText = getMessageDisplayText(lastMessage, deletedLabel)?.trim() || '';

    let resolvedPreviewText: string | null = rawPreviewText;

    if (!resolvedPreviewText && lastMessage && !isDeletedMessage(lastMessage)) {
        const lastMessageAttachments = lastMessage.attachments ?? [];
        if (lastMessageAttachments.some((attachment) => isAudioAttachment(attachment))) {
            resolvedPreviewText = 'Audio note';
        } else if (lastMessageAttachments.some((attachment) => isImageAttachment(attachment))) {
            resolvedPreviewText = 'Image';
        } else if (lastMessageAttachments.length > 0) {
            resolvedPreviewText = 'Attachment';
        }
    }

    return {
        last_message_text: resolvedPreviewText,
        last_message_at: lastMessage?.created_at ?? null,
    };
};

const getLifecycleBannerClassName = (tone: MessagingPolicyTone) => {
    switch (tone) {
        case 'success':
            return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200';
        case 'warning':
            return 'border-amber-500/40 bg-amber-500/10 text-amber-100';
        case 'danger':
            return 'border-red-500/40 bg-red-500/10 text-red-100';
        case 'info':
            return 'border-blue-500/40 bg-blue-500/10 text-blue-100';
        case 'none':
        default:
            return 'border-[#333] bg-[#141414] text-gray-300';
    }
};

/**
 * Derive the counterparty role label for a conversation.
 *
 * With the new per-participant inbox system we can read the inbox assignment
 * directly: MY inbox assignment tells me my role, so the counterparty's role
 * is the opposite.
 *
 * Falls back to the legacy conversation_scope heuristic when the inbox columns
 * are not yet present (pre-migration data).
 */
const getCounterpartyRoleFromConversation = (
    conversation: Conversation,
    userId: string | undefined,
    activeMode: string | null | undefined
): 'client' | 'freelancer' | null => {
    // Use per-participant inbox columns when available (post-migration)
    if (userId) {
        const isParticipant1 = conversation.participant_1 === userId;
        const myInbox = isParticipant1
            ? conversation.inbox_participant_1
            : conversation.inbox_participant_2;

        if (myInbox === 'client') return 'freelancer';    // I am client → they are freelancer
        if (myInbox === 'freelancer') return 'client';    // I am freelancer → they are client
        if (myInbox === 'contract') {
            // For contract conversations use active mode as hint
            if (activeMode === 'client') return 'freelancer';
            if (activeMode === 'freelancer') return 'client';
        }
        // myInbox === 'shared' or undefined → fall through to legacy heuristic
    }

    // Legacy fallback: derive from conversation_scope
    const scope = conversation.conversation_scope;
    if (scope === 'client') return 'freelancer';
    if (scope === 'freelancer') return 'client';
    if (scope === 'contract') {
        if (activeMode === 'client') return 'freelancer';
        if (activeMode === 'freelancer') return 'client';
    }
    return null;
};

function MessagesComponent() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { user, profile, activeMode } = useAuth();
    const { showToast } = useToast();
    const { tx, language } = useTranslation();
    const deletedMessageLabel = tx('pages.messages.deletedMessage', undefined, 'Message deleted');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messageInputRef = useRef<HTMLTextAreaElement>(null);

    const conversationsParentRef = useRef<HTMLDivElement>(null);
    const messagesParentRef = useRef<HTMLDivElement>(null);

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<ThreadMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'unread' | 'starred'>('all');
    const [showMobileThread, setShowMobileThread] = useState(false);
    const [isLoadingConversations, setIsLoadingConversations] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [pendingQueue, setPendingQueue] = useState<any[]>([]);
    const [contractStatusById, setContractStatusById] = useState<Record<string, ContractMessagingStatus>>({});
    const [page, setPage] = useState(0);
    const [hasMoreConversations, setHasMoreConversations] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [replyTarget, setReplyTarget] = useState<ReplyMetadata | null>(null);
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const replyHighlightTimeoutRef = useRef<number | null>(null);
     const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const {
        isRecording,
        recordingTime,
        startRecording,
        stopRecording,
        cancelRecording,
        audioBlob,
        error: audioRecorderError,
    } = useAudioRecorder();

    const [deletedForMeMessageIds, setDeletedForMeMessageIds] = useState<Set<string>>(new Set());
    const [messagePendingDelete, setMessagePendingDelete] = useState<ThreadMessage | null>(null);

    const conversationsChannelRef = useRef<RealtimeChannel | null>(null);
    const messagesChannelRef = useRef<RealtimeChannel | null>(null);
    const messageRequestIdRef = useRef(0);
    const messageCacheRef = useRef<Record<string, ThreadMessage[]>>({});
    const prefetchedConversationIdsRef = useRef<Set<string>>(new Set());
    const previewHydratedConversationIdsRef = useRef<Set<string>>(new Set());

    const conversationScopes = resolveConversationScopes(activeMode ?? profile?.active_mode);
    const conversationsModeCacheKey = resolveModeCacheKey(activeMode ?? profile?.active_mode);
    const contractConversationIds = useMemo(() => {
        return Array.from(
            new Set(
                conversations
                    .map((conversation) => conversation.contract_id)
                    .filter((contractId): contractId is string => Boolean(contractId))
            )
        ).sort();
    }, [conversations]);
    const contractConversationIdsKey = useMemo(() => contractConversationIds.join('|'), [contractConversationIds]);

    const getConversationLifecyclePolicy = useCallback((conversation: Conversation) => {
        const isContractConversation = Boolean(conversation.contract_id);
        const contractStatus = conversation.contract_id
            ? contractStatusById[conversation.contract_id]
            : null;

        return resolveMessagingLifecyclePolicy({
            kind: isContractConversation ? 'contract' : 'direct',
            contractStatus,
        });
    }, [contractStatusById]);

    const selectedConversationPolicy = useMemo(() => {
        if (!selectedConversation) return null;
        return getConversationLifecyclePolicy(selectedConversation);
    }, [getConversationLifecyclePolicy, selectedConversation]);

    const canSendInSelectedConversation = selectedConversationPolicy?.canSend ?? false;
    const canAttachInSelectedConversation = selectedConversationPolicy?.canAttachFiles ?? false;
    const canSendVoiceInSelectedConversation = selectedConversationPolicy?.canSendVoiceNotes ?? false;
    const canReplyInSelectedConversation = selectedConversationPolicy?.canReply ?? false;

    const deleteModalWorkspaceVars = useMemo(() => {
        return {
            '--workspace-primary': '#9333ea',
            '--workspace-primary-hover': '#a855f7',
            '--workspace-primary-active': '#7e22ce',
            '--workspace-primary-dim': 'rgba(147, 51, 234, 0.14)',
            '--workspace-primary-text': '#ffffff',
        } as CSSProperties;
    }, []);

    const getConversationIdentityLabel = useCallback((conversation: Conversation) => {
        const username = conversation.otherUser.username?.trim();
        const counterpartyRole = getCounterpartyRoleFromConversation(
            conversation,
            user?.id,
            activeMode ?? profile?.active_mode
        );

        const roleLabel = counterpartyRole
            ? tx(`mobileNav.${counterpartyRole}`, undefined, counterpartyRole === 'client' ? 'Client' : 'Freelancer')
            : null;

        if (roleLabel && username) return `${roleLabel} • @${username}`;
        if (roleLabel) return roleLabel;

        return `@${username || tx('pages.messages.userFallback', undefined, 'user')}`;
    }, [activeMode, profile?.active_mode, user?.id, tx]);

    const getConversationContextLabel = useCallback((conversation: Conversation) => {
        const lifecyclePolicy = getConversationLifecyclePolicy(conversation);

        if (lifecyclePolicy.kind === 'direct') {
            return tx('pages.messages.directContext', undefined, lifecyclePolicy.contextLabelFallback);
        }

        const contractLabel = tx('pages.messages.contractContext', undefined, 'Contract chat');
        let statusLabel: string | null = null;

        switch (lifecyclePolicy.contractStatus) {
            case 'active':
                statusLabel = tx('contract.inProgress', undefined, 'Active');
                break;
            case 'pending_payment':
                statusLabel = tx('contract.pendingPayment', undefined, 'Pending payment');
                break;
            case 'completed':
                statusLabel = tx('contract.completed', undefined, 'Completed');
                break;
            case 'cancelled':
                statusLabel = tx('contract.cancelled', undefined, 'Cancelled');
                break;
            case 'disputed':
                statusLabel = tx('contract.disputeOpened', undefined, 'Disputed');
                break;
            case 'unknown':
            default:
                statusLabel = null;
        }

        return statusLabel ? `${contractLabel} • ${statusLabel}` : contractLabel;
    }, [getConversationLifecyclePolicy, tx]);

    const handleOpenAttachment = useCallback(async (attachment: NonNullable<Message['attachments']>[number]) => {
        const sourceUrl = resolveMessageAttachmentUrl(attachment.url);
        if (!sourceUrl) {
            showToast(tx('pages.messages.errors.invalidAttachment', undefined, 'Attachment link is not available'), 'error');
            return;
        }

        const normalizedType = normalizeMimeType(attachment.type);
        const canPreviewInTab = normalizedType.startsWith('image/')
            || normalizedType.startsWith('audio/')
            || normalizedType.startsWith('video/')
            || normalizedType === 'application/pdf';

        try {
            const response = await fetch(sourceUrl, { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const blob = await response.blob();
            openBlobAsPreviewOrDownload(blob, attachment.name || 'attachment', canPreviewInTab);
        } catch (error) {
            try {
                const attachmentPath = extractMessageAttachmentPath(attachment.url);
                if (!attachmentPath) throw error;

                const { data, error: downloadError } = await supabase.storage
                    .from('message_attachments')
                    .download(attachmentPath);

                if (downloadError || !data) {
                    throw downloadError || error;
                }

                openBlobAsPreviewOrDownload(data, attachment.name || 'attachment', canPreviewInTab);
            } catch (downloadError) {
                console.error('[Messages] Failed to open attachment via fallback:', downloadError);
                showToast(tx('pages.messages.errors.openAttachment', undefined, 'Failed to open attachment right now'), 'error');
            }
        }
    }, [showToast, tx]);

    // Typing indicators
    const { typingUsers, startTyping, stopTyping } = useTypingIndicator(
        selectedConversation?.id || null,
        user?.id || null
    );

    // Read receipts
    useReadReceipts({
        conversationId: selectedConversation?.id || null,
        currentUserId: user?.id || null,
        messages,
        onMarkedRead: (messageIds) => {
            const ids = new Set(messageIds);
            setMessages((prev) => prev.map((message) => (
                ids.has(message.id) ? { ...message, is_read: true, status: undefined } : message
            )));
            if (selectedConversation) {
                setConversations((prev) => prev.map((conversation) => (
                    conversation.id === selectedConversation.id
                        ? { ...conversation, unread_count: 0 }
                        : conversation
                )));
            }
        },
    });

    // Network status listener
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    useEffect(() => {
        if (!audioRecorderError) return;
        showToast(audioRecorderError.message, 'error');
    }, [audioRecorderError, showToast]);

    useEffect(() => {
        if (!isMenuOpen) return;

        const handlePointerDown = (event: MouseEvent) => {
            if (!menuRef.current?.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isMenuOpen]);

    useEffect(() => {
        setIsMenuOpen(false);
        setReplyTarget(null);
    }, [selectedConversation?.id]);

    useEffect(() => {
        if (!selectedConversationPolicy || selectedConversationPolicy.canSend) return;

        if (replyTarget) {
            setReplyTarget(null);
        }

        if (selectedFile) {
            setSelectedFile(null);
        }

        if (audioBlob) {
            cancelRecording();
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [audioBlob, cancelRecording, replyTarget, selectedConversationPolicy, selectedFile]);

    useEffect(() => {
        return () => {
            if (replyHighlightTimeoutRef.current) {
                window.clearTimeout(replyHighlightTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!audioBlob) {
            setAudioPreviewUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(audioBlob);
        setAudioPreviewUrl(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [audioBlob]);

    // Sync pending queue when back online
    useEffect(() => {
        if (isOnline && pendingQueue.length > 0 && selectedConversation && user) {
            const selectedLifecyclePolicy = getConversationLifecyclePolicy(selectedConversation);
            if (!selectedLifecyclePolicy.canSend) {
                return;
            }

            const syncQueue = async () => {
                const currentQueue = [...pendingQueue];
                setPendingQueue([]);
                
                for (const pendingMsg of currentQueue) {
                    try {
                        const attachments = [];
                        
                        // Handle base64-encoded files (new format)
                        if (pendingMsg.fileBase64 && pendingMsg.fileName && pendingMsg.fileType) {
                            const file = base64ToFile(pendingMsg.fileBase64, pendingMsg.fileName, pendingMsg.fileType);
                            const { url, error } = await uploadMessageAttachment(file, selectedConversation.id);
                            if (url && !error) {
                                attachments.push({ 
                                    name: pendingMsg.fileName, 
                                    url, 
                                    type: pendingMsg.fileType, 
                                    size: pendingMsg.fileSize || file.size 
                                });
                            }
                        }
                        // Handle base64-encoded audio (new format)
                        if (pendingMsg.audioBase64 && pendingMsg.audioFileName && pendingMsg.audioType) {
                            const audioFile = base64ToFile(pendingMsg.audioBase64, pendingMsg.audioFileName, pendingMsg.audioType);
                            const { url, error } = await uploadMessageAttachment(audioFile, selectedConversation.id);
                            if (url && !error) {
                                attachments.push({ 
                                    name: tx('pages.messages.voiceMemo', undefined, 'Audio note'), 
                                    url, 
                                    type: audioFile.type, 
                                    size: audioFile.size 
                                });
                            }
                        }
                        
                        // Legacy support: Handle old format with File objects (won't survive reload but works in-session)
                        if (pendingMsg.offlineFile) {
                            const { url, error } = await uploadMessageAttachment(pendingMsg.offlineFile, selectedConversation.id);
                            if (url && !error) {
                                attachments.push({ 
                                    name: pendingMsg.offlineFile.name, 
                                    url, 
                                    type: pendingMsg.offlineFile.type, 
                                    size: pendingMsg.offlineFile.size 
                                });
                            }
                        }
                        if (pendingMsg.offlineAudio) {
                            const audioFile = new File([pendingMsg.offlineAudio], pendingMsg.offlineFileName, { type: pendingMsg.offlineAudio.type || 'audio/webm' });
                            const { url, error } = await uploadMessageAttachment(audioFile, selectedConversation.id);
                            if (url && !error) {
                                attachments.push({ 
                                    name: tx('pages.messages.voiceMemo', undefined, 'Audio note'), 
                                    url, 
                                    type: audioFile.type, 
                                    size: audioFile.size 
                                });
                            }
                        }

                        await sendMessage({
                            conversationId: selectedConversation.id,
                            senderId: user.id,
                            receiverId: selectedConversation.otherUser.id,
                            content: pendingMsg.content || '',
                            contractId: selectedConversation.contract_id,
                            attachments: attachments.length > 0 ? attachments : undefined
                        });
                    } catch (err) {
                        console.error("Failed to sync offline message", err);
                    }
                }
                
                // Clear localstorage backup
                localStorage.removeItem(`pendingQueue_${selectedConversation.id}`);
                showToast(tx('pages.messages.offline.synced', undefined, 'Offline messages synced successfully'), 'success');
            };
            
            syncQueue();
        }
    }, [isOnline, selectedConversation?.id]); // Note: Depends on selectedConversation. If they switched chats, this basic version only syncs the active one, but it handles the primary UX loop.

    // Load pending from localstorage on load
    useEffect(() => {
        if (selectedConversation) {
            const savedQueue = localStorage.getItem(`pendingQueue_${selectedConversation.id}`);
            if (savedQueue) {
                try {
                    // Note: File objects don't survive JSON stringify, but basic text does.
                    const parsed = JSON.parse(savedQueue);
                    setPendingQueue(parsed);
                } catch(_e) {
                    // Ignore invalid JSON in localStorage pending queue
                }
            }
        }
    }, [selectedConversation?.id]);


    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        const parent = messagesParentRef.current;
        if (!parent) return;

        window.requestAnimationFrame(() => {
            messagesVirtualizer.scrollToIndex(Math.max(messages.length - 1, 0), { align: 'end' });
            parent.scrollTo({ top: parent.scrollHeight, behavior });
        });
    };

    // Check if user is viewing the bottom of the conversation (within 500px)
    const isUserViewingBottom = () => {
        const parent = messagesParentRef.current;
        if (!parent) return false;
        
        return (parent.scrollHeight - parent.scrollTop - parent.clientHeight) < 500;
    };

    useEffect(() => {
        // Only auto-scroll to bottom if user is already viewing the bottom
        // This prevents jarring scroll when deleting messages higher up
        if (isUserViewingBottom()) {
            scrollToBottom('auto');
        }
    }, [messages]);

    useEffect(() => {
        if (!selectedConversation || messages.length === 0 || isLoadingMessages) return;
        scrollToBottom('auto');
    }, [selectedConversation?.id, messages.length, isLoadingMessages]);

    useEffect(() => {
        if (!selectedConversation) return;

        const frame = window.requestAnimationFrame(() => {
            messageInputRef.current?.focus();
        });

        return () => window.cancelAnimationFrame(frame);
    }, [selectedConversation?.id, isSending]);

    const handleSelectConversation = async (conversation: Conversation) => {
        if (selectedConversation?.id === conversation.id) return;

        setSelectedConversation(conversation);
        setShowMobileThread(true);

        const cachedMessages = messageCacheRef.current[conversation.id]
            ?? readSessionCache<ThreadMessage[]>(getMessagesCacheKey(conversation.id));
        if (cachedMessages) {
            setMessages(cachedMessages);
            setIsLoadingMessages(false);
        } else {
            void prefetchConversationMessages(conversation.id);
        }
        
        // Load draft for this conversation
        const draft = localStorage.getItem(`draft_${conversation.id}`);
        setNewMessage(draft || '');

        // Mark as read and update UI
        if (user && conversation.unread_count > 0) {
            await markConversationRead(conversation.id, user.id);
            setConversations((prev) =>
                prev.map((conv) =>
                    conv.id === conversation.id ? { ...conv, unread_count: 0 } : conv
                )
            );
        }
    };

    const updateConversationPreview = (
        conversationId: string,
        updater: (conversation: Conversation) => Conversation
    ) => {
        setConversations((prev) => {
            const next = prev.map((conversation) => (
                conversation.id === conversationId ? updater(conversation) : conversation
            ));
            return sortConversationsByActivity(next);
        });
    };

    const cacheMessagesForConversation = (conversationId: string, threadMessages: ThreadMessage[]) => {
        messageCacheRef.current[conversationId] = threadMessages;
        writeSessionCache(
            getMessagesCacheKey(conversationId),
            threadMessages.slice(-MAX_CACHED_MESSAGES)
        );
    };

    const prefetchConversationMessages = async (conversationId: string) => {
        if (prefetchedConversationIdsRef.current.has(conversationId)) return;
        prefetchedConversationIdsRef.current.add(conversationId);

        const cachedMessages = messageCacheRef.current[conversationId]
            ?? readSessionCache<ThreadMessage[]>(getMessagesCacheKey(conversationId));
        if (cachedMessages && cachedMessages.length > 0) return;

        const { data } = await getMessages(conversationId);
        if (data) {
            cacheMessagesForConversation(conversationId, data as ThreadMessage[]);
        }
    };

    const handleDeleteMessage = (message: ThreadMessage) => {
        if (!selectedConversation || !user || message.sender_id !== user.id || message.status === 'sending') {
            return;
        }

        // Show modal to choose delete type
        setMessagePendingDelete(message);
    };

    const confirmDeleteMessage = async (deleteType: 'me' | 'everyone') => {
        const message = messagePendingDelete;
        if (!message || !selectedConversation || !user) return;

        // Close modal
        setMessagePendingDelete(null);

        const previousMessages = messages;
        let nextMessages: ThreadMessage[];
        
        if (deleteType === 'everyone') {
            // Mark as deleted for everyone
            nextMessages = previousMessages.map((item) => (
                item.id === message.id
                    ? {
                        ...item,
                        is_deleted: true,
                        deleted_at: new Date().toISOString(),
                        deleted_by: user.id,
                        attachments: [],
                        is_read: true,
                    }
                    : item
            ));
        } else {
            // Delete for me only - just remove from view and track locally
            nextMessages = previousMessages.filter(item => item.id !== message.id);
            const newDeletedForMe = new Set(deletedForMeMessageIds);
            newDeletedForMe.add(message.id);
            setDeletedForMeMessageIds(newDeletedForMe);
        }

        const nextPreview = getThreadPreview(nextMessages, deletedMessageLabel);

        setDeletingMessageId(message.id);
        setMessages(nextMessages);
        updateConversationPreview(selectedConversation.id, (conversation) => ({
            ...conversation,
            ...nextPreview,
        }));

        // Only call backend for "delete for everyone"
        if (deleteType === 'everyone') {
            const { error } = await deleteMessage(message.id);

            if (error) {
                setMessages(previousMessages);
                updateConversationPreview(selectedConversation.id, (conversation) => ({
                    ...conversation,
                    ...getThreadPreview(previousMessages, deletedMessageLabel),
                }));
                showToast(error.message, 'error');
            }
        }

        setDeletingMessageId(null);
    };


    // On mode switch: reset all conversation state, then immediately hydrate from the
    // new mode's session cache if available. Combining these into one effect ensures
    // the reset always happens before the cache load — no flash of wrong-mode data.
    useEffect(() => {
        // 1. Reset everything for the incoming mode
        setConversations([]);
        setSelectedConversation(null);
        setMessages([]);
        setPage(0);
        setHasMoreConversations(true);

        if (!user?.id) return;

        // 2. Load the new mode's cached conversations (different key per mode)
        const cachedConversations = readSessionCache<Conversation[]>(getConversationsCacheKey(user.id, conversationsModeCacheKey));
        if (cachedConversations && cachedConversations.length > 0) {
            setConversations(cachedConversations);
            setIsLoadingConversations(false);
        }
    }, [user?.id, conversationsModeCacheKey]);


    useEffect(() => {
        if (!user?.id || conversations.length === 0) return;
        writeSessionCache(
            getConversationsCacheKey(user.id, conversationsModeCacheKey),
            conversations.slice(0, MAX_CACHED_CONVERSATIONS)
        );

        conversations.slice(0, 4).forEach((conversation) => {
            void prefetchConversationMessages(conversation.id);
        });
    }, [user?.id, conversations, conversationsModeCacheKey]);

    useEffect(() => {
        if (!selectedConversation?.id) return;
        if (messages.length > 0 && messages.some((message) => message.conversation_id !== selectedConversation.id)) {
            return;
        }
        cacheMessagesForConversation(selectedConversation.id, messages);
    }, [selectedConversation?.id, messages]);

    useEffect(() => {
        if (contractConversationIds.length === 0) {
            setContractStatusById({});
            return;
        }

        let cancelled = false;

        const loadContractStatuses = async () => {
            const { data, error } = await supabase
                .from('contracts')
                .select('id, status')
                .in('id', contractConversationIds);

            if (cancelled) return;

            if (error) {
                console.warn('[Messages] Failed to load contract statuses for lifecycle policy', error);
                return;
            }

            const nextStatuses: Record<string, ContractMessagingStatus> = {};
            for (const contractId of contractConversationIds) {
                nextStatuses[contractId] = 'unknown';
            }

            for (const row of (data ?? []) as Array<{ id: string; status: string | null }>) {
                if (!row?.id) continue;
                nextStatuses[row.id] = normalizeContractStatus(row.status);
            }

            setContractStatusById((prev) => {
                const previousKeys = Object.keys(prev);
                const nextKeys = Object.keys(nextStatuses);

                const isSameShape = previousKeys.length === nextKeys.length
                    && nextKeys.every((key) => Object.prototype.hasOwnProperty.call(prev, key));
                if (!isSameShape) return nextStatuses;

                const isSameValues = nextKeys.every((key) => prev[key] === nextStatuses[key]);
                return isSameValues ? prev : nextStatuses;
            });
        };

        void loadContractStatuses();

        return () => {
            cancelled = true;
        };
    }, [contractConversationIdsKey]);

    // Auto-select conversation from URL params or navigation state.
    // Supports:
    // - /messages?conversation=<conversationId>
    // - /messages?contract=<contractId>
    // - navigate('/messages', { state: { contractId } })
    useEffect(() => {
        if (conversations.length === 0) return;

        const targetConversationId = searchParams.get('conversation');
        const stateContractId = (location.state as { contractId?: string } | null)?.contractId || null;
        const targetContractId = searchParams.get('contract') || stateContractId;

        let match: Conversation | undefined;

        if (targetConversationId) {
            match = conversations.find((conversation) => conversation.id === targetConversationId);
        }

        if (!match && targetContractId) {
            match = conversations.find((conversation) => conversation.contract_id === targetContractId);
        }

        if (match) {
            void handleSelectConversation(match);
            // Clean transient route hints after selection.
            navigate('/messages', { replace: true, state: null });
        }
    }, [searchParams, conversations, location.state]);

    // Load conversations
    useEffect(() => {
        if (!user) return;

        const loadConversations = async (currentPage: number, append: boolean = false) => {
            if (!append && conversations.length === 0) setIsLoadingConversations(true);
            if (append) setIsLoadingMore(true);

            const limit = 20;
            const { data, count, error } = await getConversations(user.id, currentPage, limit, {
                scopes: conversationScopes,
            });

            if (error) {
                showToast(error.message, 'error');
                setIsLoadingConversations(false);
                setIsLoadingMore(false);
            } else if (data) {
                if (append) {
                    setConversations(prev => {
                        const existingIds = new Set(prev.map(c => c.id));
                        const uniqueNew = data.filter(c => !existingIds.has(c.id));
                        return sortConversationsByActivity([...prev, ...uniqueNew]);
                    });
                } else {
                    setConversations(sortConversationsByActivity(data));
                }
                setHasMoreConversations((currentPage + 1) * limit < (count || 0));
                setIsLoadingConversations(false);
                setIsLoadingMore(false);
            } else {
                // Handle edge case: no error and no data (should not happen)
                console.warn('[loadConversations] Unexpected state: no error and no data');
                setIsLoadingConversations(false);
                setIsLoadingMore(false);
            }
        };

        void loadConversations(page, page > 0);

        // Only setup subscription on initial mount/page 0 to avoid duplicates
        if (page === 0) {
            conversationsChannelRef.current = subscribeToConversations(user.id, conversationScopes, (payload) => {
                const eventType = payload.eventType;
                if (eventType === 'UPDATE') {
                    const changed = payload.new as any;
                    setConversations(prev => {
                        const idx = prev.findIndex(c => c.id === changed.id);
                        if (idx > -1) {
                            const updated = [...prev];
                            const isParticipant1 = changed.participant_1 === user.id;
                            const unread_count = isParticipant1 ? changed.unread_count_1 : changed.unread_count_2;
                            updated[idx] = {
                                ...updated[idx],
                                last_message_text: changed.last_message_text,
                                last_message_at: changed.last_message_at,
                                unread_count: unread_count || 0,
                            };
                            return sortConversationsByActivity(updated);
                        }
                        // If it's a new conversation we don't have loaded, do a fetch
                        loadConversations(0, false);
                        return prev;
                    });
                } else if (eventType === 'INSERT') {
                    loadConversations(0, false);
                    setPage(0);
                }
            });
        }

        return () => {
            if (page === 0 && conversationsChannelRef.current) {
                conversationsChannelRef.current.unsubscribe();
            }
        };
    }, [user?.id, page, conversationScopes.join('|')]);

    // Reset pagination when filter or search changes
    useEffect(() => {
        setPage(0);
    }, [filter, searchQuery]);

    // Load messages when conversation is selected
    useEffect(() => {
        if (!selectedConversation || !user) return;

        const loadMessages = async () => {
            const requestId = ++messageRequestIdRef.current;
            const cachedMessages = messageCacheRef.current[selectedConversation.id]
                ?? readSessionCache<ThreadMessage[]>(getMessagesCacheKey(selectedConversation.id));

            if (cachedMessages && cachedMessages.length > 0) {
                setMessages(cachedMessages);
                setIsLoadingMessages(false);
            } else {
                setMessages([]);
                setIsLoadingMessages(true);
            }

            const { data, error } = await getMessages(selectedConversation.id);

            if (messageRequestIdRef.current !== requestId) return;

            if (error) {
                if (!cachedMessages || cachedMessages.length === 0) {
                    showToast(error.message, 'error');
                }
            } else if (data) {
                const threadMessages = data as ThreadMessage[];
                setMessages(threadMessages);
                messageCacheRef.current[selectedConversation.id] = threadMessages;

                const lastMessage = threadMessages[threadMessages.length - 1] ?? null;
                if (lastMessage) {
                    updateConversationPreview(selectedConversation.id, (conversation) => ({
                        ...conversation,
                        last_message_text: getReplyPreviewTextForMessage(lastMessage),
                        last_message_at: lastMessage.created_at,
                    }));
                }
            }

            setIsLoadingMessages(false);

            // Mark conversation as read
            const { error: readError } = await markConversationRead(selectedConversation.id, user.id);
            if (!readError && messageRequestIdRef.current === requestId) {
                setMessages((prev) => prev.map((message) => (
                    message.receiver_id === user.id ? { ...message, is_read: true, status: undefined } : message
                )));
                updateConversationPreview(selectedConversation.id, (conversation) => ({
                    ...conversation,
                    unread_count: 0,
                }));
            }
        };

        loadMessages();

        // Subscribe to new messages in this conversation
        messagesChannelRef.current = subscribeToConversation(
            selectedConversation.id,
            (payload) => {
                if (payload.eventType === 'UPDATE') {
                    const updatedMessage = payload.new as unknown as ThreadMessage;
                    setMessages((prev) => {
                        const nextMessages = prev.map((message) => (
                            message.id === updatedMessage.id ? { ...message, ...updatedMessage, status: undefined } : message
                        ));

                        updateConversationPreview(selectedConversation.id, (conversation) => ({
                            ...conversation,
                            ...getThreadPreview(nextMessages, deletedMessageLabel),
                        }));

                        return nextMessages;
                    });
                    return;
                }

                if (payload.eventType === 'DELETE') {
                    const deletedMessage = payload.old as unknown as ThreadMessage;
                    setMessages((prev) => {
                        const nextMessages = prev.filter((message) => message.id !== deletedMessage.id);
                        updateConversationPreview(selectedConversation.id, (conversation) => ({
                            ...conversation,
                            ...getThreadPreview(nextMessages, deletedMessageLabel),
                        }));
                        return nextMessages;
                    });
                    return;
                }

                if (payload.eventType !== 'INSERT') return;

                const newMsg = payload.new as unknown as ThreadMessage;

                setMessages((prev) => {
                    if (prev.some((message) => message.id === newMsg.id)) {
                        return prev;
                    }

                    const optimisticIndex = prev.findIndex((message) => (
                        message.status === 'sending'
                        && message.sender_id === newMsg.sender_id
                        && message.receiver_id === newMsg.receiver_id
                        && message.content === newMsg.content
                    ));

                    if (optimisticIndex > -1) {
                        const updated = [...prev];
                        updated[optimisticIndex] = { ...newMsg };
                        return updated;
                    }

                    return [...prev, newMsg];
                });

                updateConversationPreview(selectedConversation.id, (conversation) => ({
                    ...conversation,
                    last_message_text: getReplyPreviewTextForMessage(newMsg),
                    last_message_at: newMsg.created_at,
                    unread_count: newMsg.sender_id === user.id ? 0 : conversation.unread_count,
                }));
            }
        );

        return () => {
            if (messagesChannelRef.current) {
                messagesChannelRef.current.unsubscribe();
            }
        };
     }, [selectedConversation?.id, user?.id]);

    // Subscribe to ALL new messages directed at this user (not just the selected conversation).
    // This keeps the sidebar conversation list fresh in real-time.
    // IMPORTANT: scope-gated — only processes messages that belong to conversations
    // already visible in the current mode's inbox (freelancer vs client). This prevents
    // a freelancer-scoped message from appearing in the client inbox and vice-versa.
    useEffect(() => {
        if (!user?.id) return;

        let globalMessagesChannelRef = null as any;

        globalMessagesChannelRef = supabase
            .channel(`user_messages:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${user.id}` // Messages sent TO this user
                },
                (payload: any) => {
                    const newMsg = payload.new as unknown as Message;

                    setConversations(prev => {
                        const convIdx = prev.findIndex(c => c.id === newMsg.conversation_id);

                        // ── Scope gate ────────────────────────────────────────────────
                        // If the conversation isn't in our current scoped list it means
                        // it belongs to a different mode (e.g. freelancer message arriving
                        // while in client mode). Do NOT mutate state — return as-is.
                        if (convIdx === -1) {
                            // A truly new conversation (never loaded yet) — trigger a
                            // page-0 reload which will fetch with the correct scopes.
                            setPage(prevPage => prevPage === 0 ? prevPage : 0);
                            return prev;
                        }

                        // Conversation exists in the current scoped list — update it
                        const updated = [...prev];
                        // Clone the conversation object so we don't mutate the array directly
                        const conv: Conversation = { ...updated[convIdx] };
                        updated.splice(convIdx, 1); // Remove from current position

                        // Update last message preview
                        conv.last_message_text = newMsg.content;
                        conv.last_message_at = newMsg.created_at;

                        // Increment unread count if it's not the currently selected conversation.
                        // Update BOTH the raw participant fields AND the derived display field
                        // so the conversation badge renders correctly without a DB round-trip.
                        if (selectedConversation?.id !== newMsg.conversation_id) {
                            const isParticipant1 = conv.participant_1 === user.id;
                            if (isParticipant1) {
                                conv.unread_count_1 = (conv.unread_count_1 || 0) + 1;
                            } else {
                                conv.unread_count_2 = (conv.unread_count_2 || 0) + 1;
                            }
                            // Keep the display field in sync — this is what the UI badge reads
                            conv.unread_count = (conv.unread_count || 0) + 1;
                        }

                        // Bubble the conversation to the top of the list
                        return [conv, ...updated];
                    });
                }
            )
            .subscribe();

        return () => {
            if (globalMessagesChannelRef) {
                globalMessagesChannelRef.unsubscribe();
            }
        };
    }, [user?.id, selectedConversation?.id]);

    useEffect(() => {
        if (selectedConversation && newMessage !== undefined) {
            const draftKey = `draft_${selectedConversation.id}`;
            if (newMessage.trim() === '') {
                localStorage.removeItem(draftKey);
            } else {
                localStorage.setItem(draftKey, newMessage);
            }
        }
    }, [newMessage, selectedConversation?.id]);

    const MAX_RECORDING_SECONDS = 5 * 60; // 5 minutes max recording limit
    useEffect(() => {
        if (isRecording && recordingTime >= MAX_RECORDING_SECONDS) {
            stopRecording();
            showToast(tx('pages.messages.errors.recordingLimit', undefined, 'Recording limit reached (5 minutes)'), 'warning');
        }
    }, [recordingTime, isRecording]);

    const handleSendMessage = async () => {
        const messageContent = newMessage.trim();
        const replyTargetSnapshot = replyTarget;
        const serializedMessageContent = serializeReplyMetadataIntoContent(messageContent, replyTargetSnapshot);

        if ((!messageContent && !selectedFile && !audioBlob) || !selectedConversation || !user) return;

        if (selectedConversationPolicy && !selectedConversationPolicy.canSend) {
            const blockedMessage = selectedConversationPolicy.blockedReasonFallback
                || 'This conversation is read-only right now.';
            showToast(
                tx(
                    'pages.messages.readOnlyThread',
                    { message: blockedMessage },
                    blockedMessage,
                ),
                'warning'
            );
            return;
        }

        if (selectedFile && selectedConversationPolicy && !selectedConversationPolicy.canAttachFiles) {
            const blockedMessage = selectedConversationPolicy.blockedReasonFallback
                || 'Attachments are disabled for this conversation.';
            showToast(
                tx('pages.messages.readOnlyThread', { message: blockedMessage }, blockedMessage),
                'warning'
            );
            return;
        }

        if (audioBlob && selectedConversationPolicy && !selectedConversationPolicy.canSendVoiceNotes) {
            const blockedMessage = selectedConversationPolicy.blockedReasonFallback
                || 'Voice notes are disabled for this conversation.';
            showToast(
                tx('pages.messages.readOnlyThread', { message: blockedMessage }, blockedMessage),
                'warning'
            );
            return;
        }

        if (!isOnline) {
            // Store offline message with base64-encoded files for persistence
            const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit for offline storage
            
            let fileBase64: string | null = null;
            let fileName: string | null = null;
            let fileType: string | null = null;
            let fileSize: number | null = null;
            
            let audioBase64: string | null = null;
            let audioFileName: string | null = null;
            let audioType: string | null = null;
            
            try {
                // Convert file to base64 if small enough
                if (selectedFile) {
                    if (selectedFile.size <= MAX_FILE_SIZE) {
                        fileBase64 = await fileToBase64(selectedFile);
                        fileName = selectedFile.name;
                        fileType = selectedFile.type;
                        fileSize = selectedFile.size;
                    } else {
                        showToast(tx('pages.messages.offline.fileTooLarge', undefined, 'File too large for offline storage (max 5MB)'), 'warning');
                        return;
                    }
                }
                
                // Convert audio blob to base64
                if (audioBlob) {
                    if (audioBlob.size <= MAX_FILE_SIZE) {
                        const voiceMemo = buildVoiceMemoFile(audioBlob);
                        audioBase64 = await blobToBase64(audioBlob);
                        audioFileName = voiceMemo.fileName;
                        audioType = voiceMemo.mimeType;
                    } else {
                        showToast(tx('pages.messages.offline.audioTooLarge', undefined, 'Audio too large for offline storage'), 'warning');
                        return;
                    }
                }
            } catch (error) {
                console.error('[Offline Queue] Failed to encode file:', error);
                showToast(tx('pages.messages.offline.encodingFailed', undefined, 'Failed to prepare file for offline storage'), 'error');
                return;
            }
            
            const offlineMsg = {
                id: `pending_${Date.now()}`,
                content: serializedMessageContent,
                fileBase64,
                fileName,
                fileType,
                fileSize,
                audioBase64,
                audioFileName,
                audioType,
            };

            const updatedQueue = [...pendingQueue, offlineMsg];
            setPendingQueue(updatedQueue);
            
            // Save to localStorage with base64-encoded files
            try {
                localStorage.setItem(`pendingQueue_${selectedConversation.id}`, JSON.stringify(updatedQueue));
            } catch (error) {
                console.error('[Offline Queue] localStorage failed:', error);
                showToast(tx('pages.messages.offline.storageFailed', undefined, 'Failed to save message offline'), 'error');
            }
            
            setNewMessage('');
            setReplyTarget(null);
            if (audioBlob) cancelRecording();
            if (selectedFile) setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            
            showToast(tx('pages.messages.offline.queued', undefined, 'You are offline. Message queued and will send when reconnected.'), 'info');
            return;
        }

        stopTyping();

        const activeConversation = selectedConversation;
        const fileToSend = selectedFile;
        const recordedAudio = audioBlob;
        const optimisticId = `temp_${Date.now()}`;
        const optimisticCreatedAt = new Date().toISOString();
        const previewText = messageContent
            || (recordedAudio
                ? tx('pages.messages.voiceMemo', undefined, 'Audio note')
                : fileToSend?.name || tx('pages.messages.attachmentLabel', undefined, 'Attachment'));
        const optimisticContent = serializedMessageContent || previewText;
        const previousPreview = {
            last_message_text: activeConversation.last_message_text,
            last_message_at: activeConversation.last_message_at,
        };

        const optimisticMessage: ThreadMessage = {
            id: optimisticId,
            conversation_id: activeConversation.id,
            sender_id: user.id,
            receiver_id: activeConversation.otherUser.id,
            content: optimisticContent,
            attachments: [],
            is_read: false,
            created_at: optimisticCreatedAt,
            contract_id: activeConversation.contract_id,
            proposal_id: null,
            status: 'sending',
            sender: {
                id: user.id,
                full_name: profile?.full_name || tx('common.you', undefined, 'You'),
                avatar_url: profile?.avatar_url || null,
            },
        };

        setMessages((prev) => [...prev, optimisticMessage]);
        updateConversationPreview(activeConversation.id, (conversation) => ({
            ...conversation,
            last_message_text: previewText,
            last_message_at: optimisticCreatedAt,
            unread_count: 0,
        }));

        setNewMessage('');
        setReplyTarget(null);
        if (fileToSend) {
            setSelectedFile(null);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        if (recordedAudio) {
            cancelRecording();
        }
        messageInputRef.current?.focus();

        setIsSending(true);
        setUploadProgress(0);
        
        let progressInterval: NodeJS.Timeout | null = null;
        if (selectedFile || audioBlob) {
            // Simulate upload progress
            progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) return prev;
                    return prev + 10;
                });
            }, 500);
        }

        const attachments: Message['attachments'] = [];

        try {
            const uploadTasks: Promise<Message['attachments'][number]>[] = [];

            if (recordedAudio) {
                const voiceMemo = buildVoiceMemoFile(recordedAudio);
                const audioFile = voiceMemo.file;
                uploadTasks.push((async () => {
                    const { url, error } = await uploadMessageAttachment(audioFile, activeConversation.id);
                    if (error || !url) {
                        throw new Error(`${tx('pages.messages.errors.audioUpload', undefined, 'Failed to upload audio')}: ${error?.message || 'Unknown error'}`);
                    }
                    return {
                        name: tx('pages.messages.voiceMemo', undefined, 'Audio note'),
                        url,
                        type: audioFile.type,
                        size: audioFile.size,
                    };
                })());
            }

            if (fileToSend) {
                uploadTasks.push((async () => {
                    const { url, error } = await uploadMessageAttachment(fileToSend, activeConversation.id);
                    if (error || !url) {
                        throw new Error(`${tx('pages.messages.errors.fileUpload', undefined, 'Failed to upload file')}: ${error?.message || 'Unknown error'}`);
                    }
                    return {
                        name: fileToSend.name,
                        url,
                        type: fileToSend.type,
                        size: fileToSend.size,
                    };
                })());
            }

            attachments.push(...await Promise.all(uploadTasks));

            if (progressInterval) {
                clearInterval(progressInterval);
                setUploadProgress(100);
            }

            const { data, error } = await sendMessage({
                conversationId: activeConversation.id,
                senderId: user.id,
                receiverId: activeConversation.otherUser.id,
                content: serializedMessageContent,
                contractId: activeConversation.contract_id,
                attachments: attachments.length > 0 ? attachments : undefined
            });

            if (error) {
                throw error;
            }

            if (data) {
                const persistedMessage = data as ThreadMessage;
                setMessages((prev) => {
                    const alreadyInserted = prev.some((message) => message.id === persistedMessage.id);
                    if (alreadyInserted) {
                        return prev.map((message) => (
                            message.id === persistedMessage.id ? { ...persistedMessage } : message
                        ));
                    }

                    const optimisticIndex = prev.findIndex((message) => message.id === optimisticId);
                    if (optimisticIndex > -1) {
                        const updated = [...prev];
                        updated[optimisticIndex] = { ...persistedMessage };
                        return updated;
                    }

                    return [...prev, { ...persistedMessage }];
                });
            }
        } catch (error) {
            const message = error instanceof Error
                ? error.message
                : tx('pages.messages.errors.sendFailed', undefined, 'Failed to send message');

            setMessages((prev) => prev.map((item) => (
                item.id === optimisticId ? { ...item, status: 'failed' } : item
            )));
            updateConversationPreview(activeConversation.id, (conversation) => ({
                ...conversation,
                last_message_text:
                    conversation.last_message_at === optimisticCreatedAt
                        ? previousPreview.last_message_text
                        : conversation.last_message_text,
                last_message_at:
                    conversation.last_message_at === optimisticCreatedAt
                        ? previousPreview.last_message_at
                        : conversation.last_message_at,
            }));
            if (messageContent) {
                setNewMessage((current) => current || messageContent);
            }
            if (replyTargetSnapshot) {
                setReplyTarget((current) => current || replyTargetSnapshot);
            }
            showToast(message, 'error');
        } finally {
            if (progressInterval) clearInterval(progressInterval);
            setIsSending(false);
            setTimeout(() => setUploadProgress(0), 1500); // clear progress bar after short delay
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!canAttachInSelectedConversation) {
                const blockedMessage = selectedConversationPolicy?.blockedReasonFallback
                    || 'Attachments are disabled for this conversation.';
                showToast(
                    tx(
                        'pages.messages.readOnlyThread',
                        { message: blockedMessage },
                        blockedMessage,
                    ),
                    'warning'
                );
                e.target.value = '';
                return;
            }

            const validation = validateUploadSelection({
                bucket: 'message_attachments',
                fileName: file.name,
                mimeType: normalizeMimeType(file.type),
                size: file.size,
            });
            if (!validation.ok) {
                showToast(validation.reason || tx('pages.messages.errors.fileUnsupported', undefined, 'Unsupported file type'), 'error');
                e.target.value = '';
                return;
            }
            setSelectedFile(file);
        }
    };

    // Filter conversations based on search and filter
    const filteredConversations = conversations.filter((c) => {
        if (filter === 'unread' && c.unread_count === 0) return false;
        if (searchQuery && !c.otherUser.full_name.toLowerCase().includes(searchQuery.toLowerCase()))
            return false;
        return true;
    });

    const displayConversations = useMemo(() => {
        const seenKeys = new Set<string>();
        const deduped: Conversation[] = [];

        for (const conversation of filteredConversations) {
            const groupingKey = conversation.contract_id
                ? `contract:${conversation.contract_id}`
                : `direct:${conversation.otherUser.id}:${conversation.conversation_scope ?? 'shared'}`;

            if (seenKeys.has(groupingKey)) continue;
            seenKeys.add(groupingKey);
            deduped.push(conversation);
        }

        return deduped;
    }, [filteredConversations]);

    const conversationsVirtualizer = useVirtualizer({
        count: displayConversations.length,
        getScrollElement: () => conversationsParentRef.current,
        estimateSize: () => 80,
        overscan: 5,
    });

    // Filter out messages deleted for the current user
    const displayMessages = messages.filter((message) => !deletedForMeMessageIds.has(message.id));

     const messagesVirtualizer = useVirtualizer({
        count: displayMessages.length,
          getItemKey: (index) => displayMessages[index]?.id ?? index,
        getScrollElement: () => messagesParentRef.current,
          estimateSize: () => 120,
          overscan: 12,
          measureElement: (element) => element?.getBoundingClientRect().height ?? 0,
    });

    const formatTime = (timestamp: string | null) => {
        if (!timestamp) return '';

        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return tx('pages.messages.time.now', undefined, 'Now');
        if (diffMins < 60) return tx('pages.messages.time.minutesAgo', { count: diffMins }, `${diffMins} min ago`);
        if (diffHours < 24) return tx('pages.messages.time.hoursAgo', { count: diffHours }, `${diffHours} h ago`);
        if (diffDays < 7) return tx('pages.messages.time.daysAgo', { count: diffDays }, `${diffDays} d ago`);

        return date.toLocaleDateString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US');
    };

    const formatMessageTime = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString(language === 'ar' ? 'ar-TN' : language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const getReplyPreviewTextForMessage = useCallback((message: ThreadMessage) => {
        const rawText = getMessageDisplayText(message, deletedMessageLabel)?.trim() || '';
        if (rawText) {
            return truncateText(rawText, MAX_REPLY_PREVIEW_LENGTH);
        }

        const attachments = message.attachments ?? [];
        if (attachments.some((attachment) => isAudioAttachment(attachment))) {
            return tx('pages.messages.voiceMemo', undefined, 'Audio note');
        }
        if (attachments.some((attachment) => isImageAttachment(attachment))) {
            return tx('pages.messages.imageLabel', undefined, 'Image');
        }
        if (attachments.length > 0) {
            return tx('pages.messages.attachmentLabel', undefined, 'Attachment');
        }

        return tx('pages.messages.attachmentLabel', undefined, 'Attachment');
    }, [deletedMessageLabel, tx]);

    const buildReplyMetadataFromMessage = useCallback((message: ThreadMessage): ReplyMetadata => {
        const senderName = message.sender_id === user?.id
            ? tx('common.you', undefined, 'You')
            : selectedConversation?.otherUser.full_name
                || message.sender?.full_name
                || tx('pages.messages.userFallback', undefined, 'user');

        return {
            messageId: message.id,
            senderName,
            previewText: getReplyPreviewTextForMessage(message),
        };
    }, [getReplyPreviewTextForMessage, selectedConversation?.otherUser.full_name, tx, user?.id]);

    const scrollToMessageById = useCallback((messageId: string) => {
        const messageIndex = displayMessages.findIndex((message) => message.id === messageId);
        if (messageIndex < 0) {
            showToast(tx('pages.messages.replyTargetMissing', undefined, 'Original message is no longer available.'), 'info');
            return;
        }

        messagesVirtualizer.scrollToIndex(messageIndex, { align: 'center' });
        setHighlightedMessageId(messageId);
        if (replyHighlightTimeoutRef.current) {
            window.clearTimeout(replyHighlightTimeoutRef.current);
        }
        replyHighlightTimeoutRef.current = window.setTimeout(() => {
            setHighlightedMessageId(null);
        }, 1800);
    }, [displayMessages, messagesVirtualizer, showToast, tx]);

    const handleReplyToMessage = useCallback((message: ThreadMessage) => {
        if (!canReplyInSelectedConversation) return;
        if (isDeletedMessage(message)) return;
        setReplyTarget(buildReplyMetadataFromMessage(message));
        messageInputRef.current?.focus();
    }, [buildReplyMetadataFromMessage, canReplyInSelectedConversation]);

    const getConversationLastPreviewText = useCallback((conversationId: string, rawLastMessageText: string | null | undefined) => {
        const inlinePreview = parseReplyMetadataFromContent(rawLastMessageText).bodyText.trim();
        if (inlinePreview) return inlinePreview;

        const cachedThread = messageCacheRef.current[conversationId];
        if (!cachedThread || cachedThread.length === 0) return null;

        return getReplyPreviewTextForMessage(cachedThread[cachedThread.length - 1]);
    }, [getReplyPreviewTextForMessage]);

    useEffect(() => {
        if (isLoadingConversations || conversations.length === 0) return;

        const candidates = conversations
            .filter((conversation) => {
                if (previewHydratedConversationIdsRef.current.has(conversation.id)) return false;
                return !getConversationLastPreviewText(conversation.id, conversation.last_message_text);
            })
            .slice(0, 6);

        if (candidates.length === 0) return;

        let cancelled = false;

        const hydrateMissingPreviews = async () => {
            const updates = await Promise.all(candidates.map(async (conversation) => {
                previewHydratedConversationIdsRef.current.add(conversation.id);

                const { data, error } = await getMessages(conversation.id, 1, 0);
                if (error || !data || data.length === 0) return null;

                const threadMessages = data as ThreadMessage[];
                const lastMessage = threadMessages[threadMessages.length - 1] ?? null;
                if (!lastMessage) return null;

                messageCacheRef.current[conversation.id] = threadMessages;
                return {
                    conversationId: conversation.id,
                    previewText: getReplyPreviewTextForMessage(lastMessage),
                    createdAt: lastMessage.created_at,
                };
            }));

            if (cancelled) return;

            const updatesById = new Map(
                updates
                    .filter((update): update is { conversationId: string; previewText: string; createdAt: string } => Boolean(update))
                    .map((update) => [update.conversationId, update])
            );

            if (updatesById.size === 0) return;

            setConversations((prev) => prev.map((conversation) => {
                const update = updatesById.get(conversation.id);
                if (!update) return conversation;

                return {
                    ...conversation,
                    last_message_text: conversation.last_message_text || update.previewText,
                    last_message_at: conversation.last_message_at || update.createdAt,
                };
            }));
        };

        void hydrateMissingPreviews();

        return () => {
            cancelled = true;
        };
    }, [conversations, getConversationLastPreviewText, getReplyPreviewTextForMessage, isLoadingConversations]);

    const renderConversationList = () => (
        <div className={`${showMobileThread ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 border-r border-[#262626] flex-col bg-[#141414] shrink-0`}>
            <div className="p-4 border-b border-[#262626]">
                <h2 className="text-xl font-bold mb-4 text-white">{tx('pages.messages.title', undefined, 'Messages')}</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={tx('pages.messages.searchPlaceholder', undefined, 'Search conversations...')}
                        className="w-full bg-[#0a0a0a] border border-[#262626] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none placeholder:text-gray-500 focus:border-purple-500"
                    />
                </div>
            </div>

            <div ref={conversationsParentRef} className="flex-1 overflow-y-auto">
                {isLoadingConversations ? (
                    <div className="h-full flex items-center justify-center px-6 py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    </div>
                ) : displayConversations.length === 0 ? (
                    <div className="h-full flex items-center justify-center px-6 py-10 text-center">
                        <p className="text-sm text-gray-400">
                            {searchQuery
                                ? tx('pages.messages.empty.noMatchingTitle', undefined, 'No matching conversations')
                                : tx('pages.messages.empty.noConversationsTitle', undefined, 'No conversations yet')}
                        </p>
                    </div>
                ) : (
                    <div style={{ height: `${conversationsVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                        {conversationsVirtualizer.getVirtualItems().map((virtualRow) => {
                            const conversation = displayConversations[virtualRow.index];
                            const isActive = selectedConversation?.id === conversation.id;
                            const previewText = getConversationLastPreviewText(conversation.id, conversation.last_message_text)
                                || ((conversation.message_count ?? 0) > 0
                                    ? tx('pages.messages.attachmentLabel', undefined, 'Attachment')
                                    : tx('pages.messages.noMessagesYet', undefined, 'No messages yet'));

                            return (
                                <div
                                    key={conversation.id}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        height: `${virtualRow.size}px`,
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                >
                                    <div
                                        onClick={() => handleSelectConversation(conversation)}
                                        onMouseEnter={() => { void prefetchConversationMessages(conversation.id); }}
                                        onFocus={() => { void prefetchConversationMessages(conversation.id); }}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                                void handleSelectConversation(conversation);
                                            }
                                        }}
                                        className={`p-4 flex gap-3 cursor-pointer transition-colors ${
                                            isActive
                                                ? 'bg-[#262626]/50 border-l-4 border-purple-500'
                                                : 'hover:bg-[#262626]/30 border-l-4 border-transparent border-b border-[#262626]/50'
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                navigate(`/freelancer/${conversation.otherUser.id}`);
                                            }}
                                            aria-label={tx('pages.messages.profileAction', undefined, 'View profile')}
                                            className="w-12 h-12 rounded-full bg-[#262626] shrink-0 relative overflow-hidden flex items-center justify-center text-sm font-semibold text-gray-200 transition-all hover:ring-2 hover:ring-purple-500/70"
                                        >
                                            <span aria-hidden="true">{conversation.otherUser.full_name.charAt(0)}</span>
                                            {conversation.otherUser.avatar_url ? (
                                                <img
                                                    src={conversation.otherUser.avatar_url}
                                                    alt={conversation.otherUser.full_name}
                                                    className="absolute inset-0 h-full w-full object-cover"
                                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                />
                                            ) : null}
                                        </button>

                                        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className={`text-sm truncate ${conversation.unread_count > 0 ? 'font-semibold text-white' : 'text-gray-200'}`}>
                                                    {conversation.otherUser.full_name}
                                                </p>
                                                <span className="text-xs text-gray-500 shrink-0">{formatTime(conversation.last_message_at)}</span>
                                            </div>
                                            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-purple-400/90 truncate">
                                                {getConversationContextLabel(conversation)}
                                            </p>
                                            <div className="mt-1 flex items-center gap-2">
                                                <p className={`text-xs truncate ${conversation.unread_count > 0 ? 'text-gray-300' : 'text-gray-400'} ${previewText === deletedMessageLabel ? 'italic' : ''}`}>
                                                    {previewText}
                                                </p>
                                                {conversation.unread_count > 0 ? (
                                                    <span className="ml-auto shrink-0 min-w-5 h-5 px-1 rounded-full text-[10px] font-semibold text-white flex items-center justify-center bg-purple-600">
                                                        {conversation.unread_count}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {hasMoreConversations && displayConversations.length > 0 && !searchQuery ? (
                    <div className="px-4 py-4 border-t border-[#262626]">
                        <button
                            type="button"
                            onClick={() => setPage((prev) => prev + 1)}
                            disabled={isLoadingMore}
                            className="w-full rounded-xl border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-2 text-sm text-gray-200 transition-colors hover:bg-[#262626] disabled:opacity-50 focus:border-purple-500"
                        >
                            {isLoadingMore ? tx('common.loading', undefined, 'Loading...') : tx('pages.messages.loadMore', undefined, 'Load more conversations')}
                        </button>
                    </div>
                ) : null}
            </div>
        </div>
    );

    const renderMessageThread = () => (
        <div className={`${showMobileThread ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-[#0a0a0a] relative`}>
            {selectedConversation ? (
                <>
                    <div className="h-16 px-4 md:px-6 border-b border-[#262626] bg-[#141414] flex items-center justify-between shrink-0 relative">
                        <div className="flex items-center gap-3 min-w-0">
                            <button
                                type="button"
                                onClick={() => setShowMobileThread(false)}
                                aria-label={tx('common.back', undefined, 'Back')}
                                className="md:hidden p-2.5 text-gray-400 hover:text-white hover:bg-[#262626] rounded-xl transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                            </button>

                            <button
                                type="button"
                                onClick={() => navigate(`/freelancer/${selectedConversation.otherUser.id}`)}
                                aria-label={tx('pages.messages.profileAction', undefined, 'View profile')}
                                className="relative w-10 h-10 rounded-full bg-[#262626] shrink-0 overflow-hidden flex items-center justify-center text-sm font-semibold text-gray-200 cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all shadow-md"
                            >
                                <span aria-hidden="true">{selectedConversation.otherUser.full_name.charAt(0)}</span>
                                {selectedConversation.otherUser.avatar_url ? (
                                    <img
                                        src={selectedConversation.otherUser.avatar_url}
                                        alt={selectedConversation.otherUser.full_name}
                                        className="absolute inset-0 h-full w-full object-cover"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                ) : null}
                            </button>

                            <div className="min-w-0">
                                <p className="font-bold text-white truncate">{selectedConversation.otherUser.full_name}</p>
                                <p className="text-xs truncate text-purple-400">{getConversationIdentityLabel(selectedConversation)}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {selectedConversation.contract_id ? (
                                <button
                                    type="button"
                                    onClick={() => navigate(`/contracts/${selectedConversation.contract_id}`)}
                                    className="hidden sm:inline-flex items-center rounded-lg border border-[#3a3a3a] px-2.5 py-1.5 text-xs font-medium text-purple-300 transition-colors hover:border-purple-500 hover:text-purple-200"
                                >
                                    {tx('pages.messages.openContract', undefined, 'Open Contract')}
                                </button>
                            ) : null}

                            <button
                                type="button"
                                onClick={() => setIsMenuOpen((prev) => !prev)}
                                aria-label={tx('common.more', undefined, 'More')}
                                className="p-2 rounded-lg text-gray-400 cursor-pointer hover:text-white hover:bg-[#262626] transition-colors"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </div>

                        {isMenuOpen ? (
                            <div ref={menuRef} className="absolute right-6 top-16 mt-2 w-48 bg-[#141414] border border-[#262626] rounded-xl shadow-2xl z-50 py-1 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => {
                                        navigate(`/freelancer/${selectedConversation.otherUser.id}`);
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer transition-colors text-gray-300 hover:bg-[#262626] hover:text-white"
                                >
                                    <User className="w-4 h-4" />
                                    <span>{tx('pages.messages.profileAction', undefined, 'View Profile')}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setConversations((prev) => prev.map((conversation) => (
                                            conversation.id === selectedConversation.id
                                                ? { ...conversation, unread_count: Math.max(1, conversation.unread_count) }
                                                : conversation
                                        )));
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer transition-colors text-gray-300 hover:bg-[#262626] hover:text-white"
                                >
                                    <Mail className="w-4 h-4" />
                                    <span>{tx('pages.messages.markUnread', undefined, 'Mark as Unread')}</span>
                                </button>

                                <div className="border-t border-[#262626] my-1" />

                                <button
                                    type="button"
                                    onClick={() => {
                                        showToast(tx('pages.messages.reportSubmitted', undefined, 'User report queued for review'), 'success');
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm cursor-pointer transition-colors text-red-500 hover:bg-red-500/10"
                                >
                                    <Flag className="w-4 h-4" />
                                    <span>{tx('pages.messages.reportUser', undefined, 'Report User')}</span>
                                </button>
                            </div>
                        ) : null}
                    </div>

                    {selectedConversationPolicy && selectedConversationPolicy.bannerTone !== 'none' && selectedConversationPolicy.bannerFallback ? (
                        <div className={`mx-4 md:mx-6 mt-4 rounded-xl border px-3 py-2 text-xs flex items-start gap-2 ${getLifecycleBannerClassName(selectedConversationPolicy.bannerTone)}`}>
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <p>
                                {tx(
                                    'pages.messages.lifecycleBanner',
                                    { message: selectedConversationPolicy.bannerFallback },
                                    selectedConversationPolicy.bannerFallback,
                                )}
                            </p>
                        </div>
                    ) : null}

                    <div ref={messagesParentRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 flex flex-col">
                        {isLoadingMessages ? (
                            <div className="flex-1 flex items-center justify-center">
                                <Loader2 className="h-7 w-7 animate-spin text-gray-400" />
                            </div>
                        ) : displayMessages.length === 0 && pendingQueue.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="text-center">
                                    <Send className="mx-auto h-10 w-10 text-gray-500" />
                                    <p className="mt-3 text-sm text-gray-400">{tx('pages.messages.emptyThread', undefined, 'No messages yet. Start the conversation!')}</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-center mb-2">
                                    <span className="bg-[#262626] text-gray-400 text-xs px-3 py-1 rounded-full">{tx('pages.messages.today', undefined, 'Today')}</span>
                                </div>

                                <div style={{ height: `${messagesVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                                    {messagesVirtualizer.getVirtualItems().map((virtualRow) => {
                                        const message = displayMessages[virtualRow.index];
                                        const isOwnMessage = message.sender_id === user?.id;
                                        const messageText = getMessageDisplayText(message, deletedMessageLabel);
                                        const replyMetadata = getMessageReplyMetadata(message);
                                        const shouldRenderMessageText = Boolean(messageText) && !shouldHideAttachmentUrlText(message);
                                        const attachments = message.attachments ?? [];
                                        const hasAttachments = attachments.length > 0;
                                        const imageAttachmentCount = attachments.filter((attachment) => isImageAttachment(attachment)).length;
                                        const hasImageAttachment = imageAttachmentCount > 0;
                                        const firstImageAttachmentIndex = attachments.findIndex((attachment) => isImageAttachment(attachment));
                                        const shouldRenderImageCaption = shouldRenderMessageText && hasImageAttachment;
                                        const shouldRenderStandaloneText = shouldRenderMessageText && !shouldRenderImageCaption;
                                        const isImageOnlyMessage = !isDeletedMessage(message)
                                            && !shouldRenderMessageText
                                            && hasAttachments
                                            && imageAttachmentCount === attachments.length;

                                        return (
                                            <div
                                                key={message.id}
                                                ref={messagesVirtualizer.measureElement}
                                                data-index={virtualRow.index}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    transform: `translateY(${virtualRow.start}px)`,
                                                    paddingBottom: '18px',
                                                }}
                                            >
                                                <div className={`group/message flex w-full ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                                    <div className="relative w-full max-w-[85%] md:max-w-[80%]">
                                                        {isOwnMessage && !message.status && !message.is_deleted ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => void handleDeleteMessage(message)}
                                                                disabled={deletingMessageId === message.id}
                                                                aria-label={tx('pages.messages.deleteMessage', undefined, 'Delete message')}
                                                                className="absolute -left-9 top-2 z-10 h-7 w-7 rounded-full border border-[#3a3a3a] bg-[#141414] text-gray-500 hidden md:flex items-center justify-center hover:text-white hover:bg-[#262626] transition-colors transition-opacity opacity-0 group-hover/message:opacity-100 focus-visible:opacity-100 disabled:opacity-50"
                                                            >
                                                                {deletingMessageId === message.id ? (
                                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                )}
                                                            </button>
                                                        ) : null}

                                                        <div className={`flex items-end gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                                            {!isOwnMessage ? (
                                                                <div className="w-6 h-6 rounded-full bg-[#262626] overflow-hidden shrink-0 flex items-center justify-center text-[10px] text-gray-300">
                                                                    <span aria-hidden="true">{selectedConversation.otherUser.full_name.charAt(0)}</span>
                                                                    {selectedConversation.otherUser.avatar_url ? (
                                                                        <img
                                                                            src={selectedConversation.otherUser.avatar_url}
                                                                            alt={selectedConversation.otherUser.full_name}
                                                                            className="absolute h-6 w-6 rounded-full object-cover"
                                                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                                        />
                                                                    ) : null}
                                                                </div>
                                                            ) : null}

                                                            <div
                                                                className={`max-w-[75%] ${
                                                                    isDeletedMessage(message)
                                                                        ? 'rounded-full border border-[#2a2a2a] bg-[#111111] text-gray-500 px-3 py-1.5 text-xs'
                                                                        : (hasImageAttachment && (isImageOnlyMessage || shouldRenderImageCaption))
                                                                        ? (isOwnMessage
                                                                            ? `bg-purple-600 p-1 overflow-hidden rounded-2xl rounded-br-sm text-white ${message.status === 'failed' ? 'ring-1 ring-red-500/70' : ''} ${message.status === 'sending' ? 'opacity-80' : ''}`
                                                                            : 'bg-[#141414] border border-[#262626] p-1 overflow-hidden rounded-2xl rounded-bl-sm text-gray-200')
                                                                        : isOwnMessage
                                                                        ? `bg-purple-600 text-white px-4 py-2 rounded-2xl rounded-br-sm text-sm shadow-md ${message.status === 'failed' ? 'ring-1 ring-red-500/70' : ''} ${message.status === 'sending' ? 'opacity-80' : ''}`
                                                                        : 'bg-[#141414] border border-[#262626] text-gray-200 px-4 py-2 rounded-2xl rounded-bl-sm text-sm'
                                                                } ${highlightedMessageId === message.id ? 'ring-1 ring-purple-400/70' : ''}`}
                                                            >
                                                                {replyMetadata ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            scrollToMessageById(replyMetadata.messageId);
                                                                        }}
                                                                        className={`mb-2 w-full rounded-lg border px-2 py-1.5 text-left ${isOwnMessage ? 'border-purple-300/40 bg-purple-700/30 text-purple-100' : 'border-[#3a3a3a] bg-[#101010] text-gray-300'}`}
                                                                        aria-label={tx('pages.messages.jumpToRepliedMessage', undefined, 'Jump to replied message')}
                                                                    >
                                                                        <p className="text-[10px] font-semibold uppercase tracking-wide opacity-90">{replyMetadata.senderName}</p>
                                                                        <p className="text-xs truncate opacity-90">{replyMetadata.previewText}</p>
                                                                    </button>
                                                                ) : null}

                                                                {shouldRenderStandaloneText ? (
                                                                    <p className={`break-words ${isDeletedMessage(message) ? 'italic leading-tight' : ''}`}>
                                                                        {messageText}
                                                                    </p>
                                                                ) : null}

                                                                {!isDeletedMessage(message) && hasAttachments ? (
                                                                    <div className={`${shouldRenderStandaloneText ? 'mt-3' : ''} space-y-2`}>
                                                                        {attachments.map((att, index) => {
                                                                            const attachmentUrl = resolveMessageAttachmentUrl(att.url);
                                                                            const isImage = isImageAttachment(att);
                                                                            const isAudio = isAudioAttachment(att);
                                                                            const extensionLabel = getAttachmentExtensionLabel(att.name, att.type);
                                                                            const fileSizeLabel = formatAttachmentSize(att.size);
                                                                            const fileMetaLabel = fileSizeLabel ? `${extensionLabel} • ${fileSizeLabel}` : extensionLabel;

                                                                            if (isImage) {
                                                                                return (
                                                                                    <button
                                                                                        key={index}
                                                                                        type="button"
                                                                                        onClick={() => { void handleOpenAttachment(att); }}
                                                                                        aria-label={tx('pages.messages.a11y.openImageAttachment', undefined, 'Open image attachment')}
                                                                                        className="block w-full max-w-sm rounded-xl overflow-hidden"
                                                                                    >
                                                                                        <div className="relative">
                                                                                            <img
                                                                                                src={attachmentUrl}
                                                                                                alt={att.name}
                                                                                                className="w-full max-w-sm rounded-xl object-cover aspect-video cursor-pointer hover:opacity-90 transition-opacity"
                                                                                                onError={(event) => {
                                                                                                    event.currentTarget.style.display = 'none';
                                                                                                    const fallback = event.currentTarget.nextElementSibling as HTMLElement | null;
                                                                                                    if (fallback) fallback.style.display = 'flex';
                                                                                                }}
                                                                                            />
                                                                                            <div className="hidden w-full max-w-sm rounded-xl aspect-video items-center justify-center bg-[#141414] border border-[#262626] text-gray-500">
                                                                                                <ImageIcon className="h-6 w-6" />
                                                                                            </div>
                                                                                        </div>
                                                                                        {shouldRenderImageCaption && index === firstImageAttachmentIndex ? (
                                                                                            <p className={`px-3 py-2 text-sm break-words ${isOwnMessage ? 'text-purple-100' : 'text-gray-200'}`}>
                                                                                                {messageText}
                                                                                            </p>
                                                                                        ) : null}
                                                                                    </button>
                                                                                );
                                                                            }

                                                                            if (isAudio) {
                                                                                return (
                                                                                    <MessageAudioPlayer
                                                                                        key={index}
                                                                                        src={attachmentUrl}
                                                                                        rawSource={att.url}
                                                                                        name={att.name}
                                                                                        mimeType={att.type}
                                                                                        isOwn={isOwnMessage}
                                                                                    />
                                                                                );
                                                                            }

                                                                            return (
                                                                                <button
                                                                                    key={index}
                                                                                    type="button"
                                                                                    onClick={() => { void handleOpenAttachment(att); }}
                                                                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors w-full max-w-sm ${
                                                                                        isOwnMessage
                                                                                            ? 'bg-purple-700/50 hover:bg-purple-700/80'
                                                                                            : 'bg-[#141414] hover:bg-[#1a1a1a] border border-[#333]'
                                                                                    }`}
                                                                                    aria-label={tx('pages.messages.a11y.openAttachment', undefined, 'Open attachment')}
                                                                                >
                                                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isOwnMessage ? 'bg-purple-500/40 text-purple-100' : 'bg-[#202020] text-purple-300'}`}>
                                                                                        <FileText className="w-5 h-5" />
                                                                                    </div>

                                                                                    <div className="min-w-0 flex-1 text-start">
                                                                                        <p className="font-semibold text-sm truncate text-gray-100">{att.name || tx('pages.messages.attachmentLabel', undefined, 'Attachment')}</p>
                                                                                        <p className="text-xs opacity-70 text-gray-300">{fileMetaLabel}</p>
                                                                                    </div>

                                                                                    <Download className="w-4 h-4 opacity-50 hover:opacity-100 transition-opacity ml-auto shrink-0 text-gray-200" />
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                ) : null}
                                                            </div>

                                                            {isOwnMessage && !isDeletedMessage(message) && !message.status ? (
                                                                <CheckCheck className={`h-3 w-3 mb-1 ${message.is_read ? 'text-purple-300' : 'text-gray-500'}`} />
                                                            ) : null}
                                                        </div>

                                                        <p className={`mt-1 text-[11px] text-gray-500 flex items-center gap-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                                                            <span>{formatMessageTime(message.created_at)}</span>
                                                            {isOwnMessage && message.status === 'sending' ? <Clock className="h-3 w-3" /> : null}
                                                            {isOwnMessage && message.status === 'failed' ? (
                                                                <span className="text-red-400">{tx('pages.messages.sendFailed', undefined, 'Failed')}</span>
                                                            ) : null}
                                                        </p>

                                                        {!isDeletedMessage(message) && canReplyInSelectedConversation ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    handleReplyToMessage(message);
                                                                }}
                                                                className={`mt-1 inline-flex items-center gap-1 text-[11px] text-gray-500 hover:text-purple-300 transition-colors opacity-0 group-hover/message:opacity-100 ${isOwnMessage ? 'ms-auto' : ''}`}
                                                                aria-label={tx('pages.messages.replyAction', undefined, 'Reply to message')}
                                                            >
                                                                <CornerUpLeft className="h-3 w-3" />
                                                                <span>{tx('pages.messages.reply', undefined, 'Reply')}</span>
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {pendingQueue.map((pendingMsg, idx) => (
                                    <div key={`pending-${idx}`} className="flex justify-end w-full opacity-70">
                                        <div className="max-w-[80%]">
                                            <div className="bg-purple-600 text-white px-4 py-2 rounded-2xl rounded-br-sm text-sm shadow-md">
                                                <p className="text-sm break-words">{parseReplyMetadataFromContent(pendingMsg.content).bodyText || tx('pages.messages.attachmentLabel', undefined, 'Attachment')}</p>
                                                {(pendingMsg.fileName || pendingMsg.audioFileName || pendingMsg.offlineFile || pendingMsg.offlineAudio) ? (
                                                    <div className="mt-2 text-xs italic opacity-90 flex items-center gap-1">
                                                        <Paperclip className="w-3 h-3" />
                                                        <span>{pendingMsg.fileName || pendingMsg.audioFileName || pendingMsg.offlineFileName || pendingMsg.offlineFile?.name || tx('pages.messages.offline.attachmentPending', undefined, 'Attachment pending')}</span>
                                                    </div>
                                                ) : null}
                                            </div>
                                            <p className="mt-1 text-[11px] text-gray-500 flex items-center justify-end gap-1">
                                                <Clock className="w-3 h-3" /> {tx('pages.messages.offline.statusWaiting', undefined, 'Pending connection...')}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                <div ref={messagesEndRef} />
                            </>
                        )}
                    </div>

                    {typingUsers.length > 0 ? (
                        <div className="px-4 md:px-6 py-2 border-t border-[#262626]">
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-purple-500" />
                                    <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-purple-500" />
                                    <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-purple-500" />
                                </div>
                                <span>
                                    {typingUsers.length === 1
                                        ? `${selectedConversation.otherUser.full_name} ${tx('pages.messages.typingIndicator.singular', undefined, 'is typing...')}`
                                        : `${typingUsers.length} ${tx('pages.messages.typingIndicator.plural', undefined, 'people are typing...')}`}
                                </span>
                            </div>
                        </div>
                    ) : null}

                    <div className="p-4 bg-[#141414] border-t border-[#262626] shrink-0">
                        {replyTarget ? (
                            <div className="mb-3 rounded-xl border border-[#333] bg-[#1a1a1a] px-3 py-2">
                                <div className="flex items-start gap-2">
                                    <span className="mt-0.5 h-8 w-1 rounded-full bg-purple-500" aria-hidden="true" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-semibold text-purple-300">{tx('pages.messages.replyingTo', undefined, 'Replying to')} {replyTarget.senderName}</p>
                                        <p className="text-xs text-gray-300 truncate">{replyTarget.previewText}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setReplyTarget(null)}
                                        className="rounded-md p-1 text-gray-400 hover:bg-[#262626] hover:text-white transition-colors"
                                        aria-label={tx('pages.messages.cancelReply', undefined, 'Cancel reply')}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ) : null}

                        {(selectedFile || audioBlob || isRecording) ? (
                            <div className="mb-3 space-y-2">
                                {isRecording ? (
                                    <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                                        <div className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                                        <span>{tx('ui.recording', undefined, 'Recording')} {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                                        <button
                                            type="button"
                                            onClick={stopRecording}
                                            aria-label={tx('pages.messages.a11y.stopRecording', undefined, 'Stop recording')}
                                            className="ml-auto p-2 rounded-lg text-red-200 hover:bg-red-500/20 transition-colors"
                                        >
                                            <Square className="w-4 h-4 fill-current" />
                                        </button>
                                    </div>
                                ) : null}

                                {audioBlob ? (
                                    <div className="rounded-xl border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-200">
                                            <FileAudio className="w-4 h-4 text-purple-400" />
                                            <span className="flex-1">{tx('pages.messages.voiceMemo', undefined, 'Audio note')} • {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:{(recordingTime % 60).toString().padStart(2, '0')}</span>
                                            <button
                                                type="button"
                                                onClick={cancelRecording}
                                                disabled={isSending}
                                                aria-label={tx('pages.messages.a11y.removeAttachedItem', undefined, 'Remove attached item')}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#262626] transition-colors disabled:opacity-50"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                        {audioPreviewUrl ? (
                                            <div className="mt-2 rounded-xl border border-[#262626] bg-[#141414] px-3 py-2">
                                                <MessageAudioPlayer
                                                    src={audioPreviewUrl}
                                                    name={tx('pages.messages.voiceMemo', undefined, 'Audio note')}
                                                    isOwn
                                                />
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}

                                {selectedFile ? (
                                    <div className="rounded-xl border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-200">
                                            <FileText className="w-4 h-4 text-purple-400" />
                                            <span className="flex-1 truncate">{selectedFile.name}</span>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedFile(null)}
                                                disabled={isSending}
                                                aria-label={tx('pages.messages.a11y.removeAttachedItem', undefined, 'Remove attached item')}
                                                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#262626] transition-colors disabled:opacity-50"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}

                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept={MESSAGE_ATTACHMENT_ACCEPT} />

                        <div className="bg-[#0a0a0a] border border-[#262626] rounded-2xl flex items-end p-1.5 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500 transition-all shadow-inner">
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isSending || !!selectedFile || !canAttachInSelectedConversation}
                                aria-label={tx('pages.messages.a11y.attachFile', undefined, 'Attach file')}
                                className="p-2.5 text-gray-500 hover:text-white hover:bg-[#262626] rounded-xl cursor-pointer transition-all disabled:opacity-50"
                            >
                                <Paperclip className="w-4 h-4" />
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    if (!canSendVoiceInSelectedConversation) {
                                        const blockedMessage = selectedConversationPolicy?.blockedReasonFallback
                                            || 'Voice notes are disabled for this conversation.';
                                        showToast(
                                            tx(
                                                'pages.messages.readOnlyThread',
                                                { message: blockedMessage },
                                                blockedMessage,
                                            ),
                                            'warning'
                                        );
                                        return;
                                    }

                                    if (isRecording) {
                                        stopRecording();
                                    } else {
                                        startRecording();
                                    }
                                }}
                                disabled={isSending || !canSendVoiceInSelectedConversation}
                                aria-label={isRecording
                                    ? tx('pages.messages.a11y.stopRecording', undefined, 'Stop recording')
                                    : tx('pages.messages.a11y.startRecording', undefined, 'Start recording')}
                                className={`p-2.5 rounded-xl transition-all ${
                                    isRecording
                                        ? 'bg-red-500/20 text-red-300'
                                        : 'text-gray-500 hover:text-white hover:bg-[#262626]'
                                } disabled:opacity-50`}
                            >
                                {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-4 h-4" />}
                            </button>

                            <textarea
                                ref={messageInputRef}
                                value={newMessage}
                                onChange={(e) => {
                                    setNewMessage(e.target.value);
                                    if (e.target.value.trim()) {
                                        startTyping();
                                    } else {
                                        stopTyping();
                                    }

                                    e.currentTarget.style.height = '44px';
                                    e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 128)}px`;
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        stopTyping();
                                        void handleSendMessage();
                                    }
                                }}
                                onBlur={stopTyping}
                                placeholder={canSendInSelectedConversation
                                    ? tx('pages.messages.messagePlaceholder', undefined, 'Type a message...')
                                    : (() => {
                                        const blockedMessage = selectedConversationPolicy?.blockedReasonFallback
                                            || 'This conversation is read-only.';
                                        return tx(
                                            'pages.messages.readOnlyPlaceholder',
                                            { message: blockedMessage },
                                            blockedMessage,
                                        );
                                    })()}
                                disabled={isSending || isRecording || !canSendInSelectedConversation}
                                rows={1}
                                className="flex-1 bg-transparent border-0 ring-0 focus:ring-0 focus:border-transparent text-white text-sm px-3 py-2.5 outline-none resize-none max-h-32 min-h-[44px] placeholder:text-gray-500 disabled:opacity-50"
                            />

                            <button
                                type="button"
                                onClick={() => {
                                    stopTyping();
                                    void handleSendMessage();
                                }}
                                disabled={(!newMessage.trim() && !selectedFile && !audioBlob) || isSending || isRecording || !canSendInSelectedConversation}
                                aria-label={tx('pages.messages.send', undefined, 'Send message')}
                                className="bg-purple-600 hover:bg-purple-500 text-white p-2.5 rounded-xl cursor-pointer transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center px-6">
                    <div className="text-center">
                        <Send className="mx-auto h-10 w-10 text-gray-500" />
                        <h3 className="mt-3 text-lg font-semibold text-white">{tx('pages.messages.selectConversationTitle', undefined, 'Select a conversation')}</h3>
                        <p className="mt-1 text-sm text-gray-400">{tx('pages.messages.selectConversationDescription', undefined, 'Choose a conversation to start messaging')}</p>
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <>
            <div className="min-h-screen bg-[#0a0a0a] text-white">
                <SEO {...SEO_CONFIG.messages} url="/messages" noIndex />
                <Header />

                <main className="flex-1 w-full h-[calc(100vh-64px)] flex flex-col md:flex-row overflow-hidden">
                    {renderConversationList()}
                    {renderMessageThread()}
                </main>
            </div>

            {/* Delete Message Modal */}
            <Modal
                isOpen={!!messagePendingDelete}
                onClose={() => {
                    if (deletingMessageId) return;
                    setMessagePendingDelete(null);
                }}
                title={tx('pages.messages.deleteMessage', undefined, 'Delete message')}
                size="sm"
            >
                <div className="space-y-5" style={deleteModalWorkspaceVars}>
                    <p className="text-sm text-muted-foreground">
                        {tx('pages.messages.deleteMessagePrompt', undefined, 'Choose how you want to delete this message:')}
                    </p>

                    {messagePendingDelete?.content ? (
                        <div className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground">
                            {messagePendingDelete.content}
                        </div>
                    ) : null}

                    <div className="flex flex-col gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => void confirmDeleteMessage('me')}
                            disabled={!!deletingMessageId}
                            className="w-full border-2"
                        >
                            {tx('pages.messages.deleteForMe', undefined, 'Delete for me')}
                        </Button>
                        
                        <Button
                            type="button"
                            variant="danger"
                            onClick={() => void confirmDeleteMessage('everyone')}
                            isLoading={!!deletingMessageId}
                            disabled={!!deletingMessageId}
                            className="w-full"
                        >
                            {tx('pages.messages.deleteForEveryone', undefined, 'Delete for everyone')}
                        </Button>

                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setMessagePendingDelete(null)}
                            disabled={!!deletingMessageId}
                            className="w-full"
                        >
                            {tx('common.cancel', undefined, 'Cancel')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
}

export default function Messages() {
    return (
        <ErrorBoundary>
            <MessagesComponent />
        </ErrorBoundary>
    );
}


