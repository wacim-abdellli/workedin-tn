import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Play, Pause, Loader2, AlertCircle } from 'lucide-react';
import { useTranslation } from '../../i18n';
import { supabase } from '../../lib/supabase';
import {
    detectAudioMimeTypeFromBuffer,
    inferAudioMimeType,
    formatAudioTime
} from '../../lib/audioProcessing';
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
export type MessageAudioPlayerProps = {
    src: string;
    rawSource?: string;
    name: string;
    mimeType?: string;
    isOwn: boolean;
    accentVariant?: 'amber' | 'violet';
};

export function MessageAudioPlayer({ src, rawSource, name, mimeType, isOwn, accentVariant = 'amber' }: MessageAudioPlayerProps) {
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
    const isVioletAccent = accentVariant === 'violet';
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
                    className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center transition-colors disabled:opacity-50 ${isOwn
                            ? (isVioletAccent ? 'bg-white text-violet-600 hover:bg-gray-100' : 'bg-white text-amber-600 hover:bg-gray-100')
                            : (isVioletAccent ? 'bg-violet-500 text-white hover:bg-violet-400' : 'bg-amber-500 text-white hover:bg-amber-400')
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
                                className={`w-1 rounded-full transition-colors ${isOwn
                                        ? (isVioletAccent
                                            ? (isActiveBar ? 'bg-violet-200' : 'bg-violet-300')
                                            : (isActiveBar ? 'bg-amber-200' : 'bg-amber-300'))
                                        : (isActiveBar ? 'bg-gray-400' : 'bg-gray-500')
                                    }`}
                                style={{ height: `${barHeight}px` }}
                            />
                        );
                    })}
                </div>

                <span className={`text-[10px] font-medium tracking-wide shrink-0 ${isOwn ? (isVioletAccent ? 'text-violet-100' : 'text-amber-100') : 'text-gray-400'}`}>
                    {formatAudioTime(defaultDuration)}
                </span>
            </div>

            {hasError ? (
                <div className={`mt-1 flex items-center gap-1 text-[10px] ${isOwn ? (isVioletAccent ? 'text-violet-100' : 'text-amber-100') : 'text-gray-400'}`}>
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{tx('pages.messages.audioPreviewUnavailable', undefined, 'Audio preview unavailable.')}</span>
                </div>
            ) : null}
        </div>
    );
}
