import { logger } from '@/lib/logger';
import { useState, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

interface UseVoiceRecordingOptions {
    maxDurationSeconds?: number;
    bucket?: string;
}

interface UseVoiceRecordingReturn {
    isRecording: boolean;
    isPaused: boolean;
    duration: number;
    audioBlob: Blob | null;
    audioUrl: string | null;
    error: string | null;
    startRecording: () => Promise<void>;
    stopRecording: () => void;
    pauseRecording: () => void;
    resumeRecording: () => void;
    clearRecording: () => void;
    uploadRecording: (path: string) => Promise<{ url: string } | null>;
}

export function useVoiceRecording({
    maxDurationSeconds = 60,
    bucket = 'voice-recordings',
}: UseVoiceRecordingOptions = {}): UseVoiceRecordingReturn {
    const [isRecording, setIsRecording] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [duration, setDuration] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Start recording
    const startRecording = useCallback(async () => {
        try {
            setError(null);
            setAudioBlob(null);
            setAudioUrl(null);
            chunksRef.current = [];

            // Request microphone access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                }
            });
            streamRef.current = stream;

            // Create MediaRecorder with best available format
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : MediaRecorder.isTypeSupported('audio/webm')
                    ? 'audio/webm'
                    : 'audio/mp4';

            const mediaRecorder = new MediaRecorder(stream, { mimeType });
            mediaRecorderRef.current = mediaRecorder;

            // Handle data chunks
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            // Handle recording stop
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                setIsRecording(false);
                setIsPaused(false);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            // Handle errors
            mediaRecorder.onerror = () => {
                setError('حدث خطأ أثناء التسجيل');
                setIsRecording(false);
            };

            // Start recording
            mediaRecorder.start(1000); // Collect data every second
            setIsRecording(true);
            setDuration(0);

            // Start duration timer
            timerRef.current = window.setInterval(() => {
                setDuration(prev => {
                    const newDuration = prev + 1;
                    // Auto-stop at max duration
                    if (newDuration >= maxDurationSeconds) {
                        stopRecording();
                    }
                    return newDuration;
                });
            }, 1000);
        } catch (err) {
            logger.error('Recording error:', err);
            if (err instanceof DOMException) {
                if (err.name === 'NotAllowedError') {
                    setError('يرجى السماح بالوصول للميكروفون من إعدادات المتصفح');
                } else if (err.name === 'NotFoundError') {
                    setError('لم يتم العثور على ميكروفون');
                } else if (err.name === 'NotSupportedError') {
                    setError('المتصفح لا يدعم التسجيل الصوتي');
                } else {
                    setError('حدث خطأ في بدء التسجيل');
                }
            } else {
                setError('حدث خطأ في بدء التسجيل');
            }
        }
    }, [maxDurationSeconds]);

    // Stop recording
    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    }, [isRecording]);

    // Pause recording
    const pauseRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording && !isPaused) {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
    }, [isRecording, isPaused]);

    // Resume recording
    const resumeRecording = useCallback(() => {
        if (mediaRecorderRef.current && isPaused) {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
            timerRef.current = window.setInterval(() => {
                setDuration(prev => {
                    if (prev + 1 >= maxDurationSeconds) {
                        stopRecording();
                    }
                    return prev + 1;
                });
            }, 1000);
        }
    }, [isPaused, maxDurationSeconds, stopRecording]);

    // Clear recording
    const clearRecording = useCallback(() => {
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        setAudioBlob(null);
        setAudioUrl(null);
        setDuration(0);
        setError(null);
        chunksRef.current = [];
    }, [audioUrl]);

    // Upload recording to Supabase Storage
    const uploadRecording = useCallback(async (path: string) => {
        if (!audioBlob) {
            setError('لا يوجد تسجيل للرفع');
            return null;
        }

        try {
            const fileName = `${path}/${Date.now()}.webm`;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(fileName, audioBlob, {
                    contentType: 'audio/webm',
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from(bucket)
                .getPublicUrl(fileName);

            return { url: urlData.publicUrl };
        } catch (err) {
            logger.error('Upload error:', err);
            setError('حدث خطأ في رفع التسجيل');
            return null;
        }
    }, [audioBlob, bucket]);

    return {
        isRecording,
        isPaused,
        duration,
        audioBlob,
        audioUrl,
        error,
        startRecording,
        stopRecording,
        pauseRecording,
        resumeRecording,
        clearRecording,
        uploadRecording,
    };
}

export default useVoiceRecording;
