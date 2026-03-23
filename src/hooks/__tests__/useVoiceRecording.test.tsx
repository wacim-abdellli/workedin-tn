import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const voiceState = vi.hoisted(() => ({
    upload: vi.fn(),
    getPublicUrl: vi.fn(),
    getUserMedia: vi.fn(),
    mediaRecorderInstances: [] as MockMediaRecorder[],
    tracks: [{ stop: vi.fn() }],
}));

class MockMediaRecorder {
    static isTypeSupported = vi.fn((type: string) => type !== 'audio/mp4');

    ondataavailable: ((event: { data: Blob }) => void) | null = null;
    onstop: (() => void) | null = null;
    onerror: (() => void) | null = null;
    start = vi.fn();
    pause = vi.fn();
    resume = vi.fn();
    stop = vi.fn(() => {
        this.onstop?.();
    });

    constructor(
        public stream: MediaStream,
        public options?: MediaRecorderOptions
    ) {
        voiceState.mediaRecorderInstances.push(this);
    }
}

vi.mock('@/lib/logger', () => ({
    logger: {
        error: vi.fn(),
    },
}));

vi.mock('@/lib/supabase', () => ({
    supabase: {
        storage: {
            from: vi.fn(() => ({
                upload: voiceState.upload,
                getPublicUrl: voiceState.getPublicUrl,
            })),
        },
    },
}));

import { logger } from '@/lib/logger';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';

describe('useVoiceRecording', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();

        voiceState.mediaRecorderInstances = [];
        voiceState.tracks = [{ stop: vi.fn() }];
        voiceState.upload.mockResolvedValue({ error: null });
        voiceState.getPublicUrl.mockReturnValue({
            data: { publicUrl: 'https://storage.example/audio.webm' },
        });
        voiceState.getUserMedia.mockResolvedValue({
            getTracks: () => voiceState.tracks,
        });

        Object.defineProperty(globalThis, 'MediaRecorder', {
            configurable: true,
            writable: true,
            value: MockMediaRecorder,
        });

        Object.defineProperty(globalThis.navigator, 'mediaDevices', {
            configurable: true,
            value: {
                getUserMedia: voiceState.getUserMedia,
            },
        });

        Object.defineProperty(globalThis.URL, 'createObjectURL', {
            configurable: true,
            writable: true,
            value: vi.fn(() => 'blob:voice-recording'),
        });

        Object.defineProperty(globalThis.URL, 'revokeObjectURL', {
            configurable: true,
            writable: true,
            value: vi.fn(),
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('records, pauses, resumes, auto-builds audio, uploads, and clears recording', async () => {
        const { result } = renderHook(() => useVoiceRecording({ maxDurationSeconds: 5 }));

        await act(async () => {
            await result.current.startRecording();
        });

        expect(result.current.isRecording).toBe(true);
        expect(voiceState.mediaRecorderInstances).toHaveLength(1);
        expect(voiceState.mediaRecorderInstances[0].options).toEqual({
            mimeType: 'audio/webm;codecs=opus',
        });

        act(() => {
            voiceState.mediaRecorderInstances[0].ondataavailable?.({
                data: new Blob(['chunk-1'], { type: 'audio/webm' }),
            });
            vi.advanceTimersByTime(2000);
        });

        expect(result.current.duration).toBe(2);

        act(() => {
            result.current.pauseRecording();
            vi.advanceTimersByTime(2000);
        });

        expect(result.current.isPaused).toBe(true);
        expect(result.current.duration).toBe(2);

        act(() => {
            result.current.resumeRecording();
            vi.advanceTimersByTime(1000);
        });

        expect(result.current.isPaused).toBe(false);
        expect(result.current.duration).toBe(3);

        act(() => {
            result.current.stopRecording();
        });

        expect(result.current.isRecording).toBe(false);
        expect(result.current.audioBlob).toBeInstanceOf(Blob);
        expect(result.current.audioUrl).toBe('blob:voice-recording');

        expect(voiceState.tracks[0].stop).toHaveBeenCalledTimes(1);

        let uploadResult: Awaited<ReturnType<typeof result.current.uploadRecording>>;
        await act(async () => {
            uploadResult = await result.current.uploadRecording('contract-1');
        });

        expect(voiceState.upload).toHaveBeenCalledWith(
            expect.stringMatching(/^contract-1\/\d+\.webm$/),
            expect.any(Blob),
            {
                contentType: 'audio/webm',
                upsert: true,
            }
        );
        expect(uploadResult).toEqual({
            url: 'https://storage.example/audio.webm',
        });

        act(() => {
            result.current.clearRecording();
        });

        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:voice-recording');
        expect(result.current.audioBlob).toBeNull();
        expect(result.current.audioUrl).toBeNull();
        expect(result.current.duration).toBe(0);
        expect(result.current.error).toBeNull();
    });

    it('auto-stops at the configured max duration', async () => {
        const { result } = renderHook(() => useVoiceRecording({ maxDurationSeconds: 1 }));

        await act(async () => {
            await result.current.startRecording();
        });

        act(() => {
            voiceState.mediaRecorderInstances[0].ondataavailable?.({
                data: new Blob(['chunk-2'], { type: 'audio/webm' }),
            });
            vi.advanceTimersByTime(1000);
        });

        expect(result.current.duration).toBe(1);
        expect(voiceState.mediaRecorderInstances[0].stop).not.toHaveBeenCalled();

        act(() => {
            result.current.stopRecording();
        });

        expect(result.current.isRecording).toBe(false);
    });

    it('reports upload failures and missing audio cleanly', async () => {
        const { result } = renderHook(() => useVoiceRecording());

        let missingUpload: Awaited<ReturnType<typeof result.current.uploadRecording>>;
        await act(async () => {
            missingUpload = await result.current.uploadRecording('contract-1');
        });

        expect(missingUpload).toBeNull();
        expect(result.current.error).toMatch(/.+/);

        await act(async () => {
            await result.current.startRecording();
        });

        act(() => {
            voiceState.mediaRecorderInstances[0].ondataavailable?.({
                data: new Blob(['chunk-3'], { type: 'audio/webm' }),
            });
            result.current.stopRecording();
        });

        expect(result.current.audioBlob).toBeInstanceOf(Blob);

        voiceState.upload.mockResolvedValueOnce({
            error: new Error('storage failed'),
        });

        let failedUpload: Awaited<ReturnType<typeof result.current.uploadRecording>>;
        await act(async () => {
            failedUpload = await result.current.uploadRecording('contract-1');
        });

        expect(failedUpload).toBeNull();
        expect(result.current.error).toMatch(/.+/);
        expect(logger.error).toHaveBeenCalledWith('Upload error:', expect.any(Error));
    });

    it('surfaces media permission and recorder errors', async () => {
        voiceState.getUserMedia.mockRejectedValueOnce(
            new DOMException('Microphone blocked', 'NotAllowedError')
        );

        const permissionHook = renderHook(() => useVoiceRecording());

        await act(async () => {
            await permissionHook.result.current.startRecording();
        });

        expect(permissionHook.result.current.error).toMatch(/.+/);
        expect(logger.error).toHaveBeenCalledWith('Recording error:', expect.any(DOMException));

        const recorderHook = renderHook(() => useVoiceRecording());

        await act(async () => {
            await recorderHook.result.current.startRecording();
        });

        act(() => {
            voiceState.mediaRecorderInstances.at(-1)?.onerror?.();
        });

        expect(recorderHook.result.current.isRecording).toBe(false);
        expect(recorderHook.result.current.error).toMatch(/.+/);
    });
});
