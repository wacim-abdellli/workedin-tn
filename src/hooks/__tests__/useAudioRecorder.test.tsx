import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const recorderState = vi.hoisted(() => ({
    getUserMedia: vi.fn(),
    mediaRecorderInstances: [] as MockMediaRecorder[],
    tracks: [{ stop: vi.fn() }],
}));

class MockMediaRecorder {
    static isTypeSupported = vi.fn((type: string) => type === 'audio/webm;codecs=opus' || type === 'audio/webm');

    ondataavailable: ((event: { data: Blob }) => void) | null = null;
    onstop: (() => void) | null = null;
    onerror: (() => void) | null = null;
    start = vi.fn();
    stop = vi.fn(() => {
        this.onstop?.();
    });
    state: 'inactive' | 'recording' = 'inactive';

    constructor(
        public stream: MediaStream,
        public options?: MediaRecorderOptions
    ) {
        this.state = 'recording';
        recorderState.mediaRecorderInstances.push(this);
    }
}

import { useAudioRecorder } from '@/hooks/useAudioRecorder';

describe('useAudioRecorder', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();

        recorderState.mediaRecorderInstances = [];
        recorderState.tracks = [{ stop: vi.fn() }];
        recorderState.getUserMedia.mockResolvedValue({
            getTracks: () => recorderState.tracks,
        });

        Object.defineProperty(globalThis, 'MediaRecorder', {
            configurable: true,
            writable: true,
            value: MockMediaRecorder,
        });

        Object.defineProperty(globalThis.navigator, 'mediaDevices', {
            configurable: true,
            writable: true,
            value: {
                getUserMedia: recorderState.getUserMedia,
            },
        });
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('starts and stops recording successfully', async () => {
        const { result } = renderHook(() => useAudioRecorder());

        expect(result.current.isRecording).toBe(false);
        expect(result.current.recordingTime).toBe(0);
        expect(result.current.audioBlob).toBeNull();
        expect(result.current.error).toBeNull();

        await act(async () => {
            await result.current.startRecording();
        });

        expect(result.current.isRecording).toBe(true);
        expect(recorderState.mediaRecorderInstances).toHaveLength(1);
        expect(recorderState.mediaRecorderInstances[0].state).toBe('recording');

        // Advance timer to test recordingTime increment
        act(() => {
            vi.advanceTimersByTime(3000);
        });

        expect(result.current.recordingTime).toBe(3);

        // Simulate data availability
        act(() => {
            recorderState.mediaRecorderInstances[0].ondataavailable?.({
                data: new Blob(['audio-data'], { type: 'audio/webm' }),
            });
        });

        // Stop the recording
        act(() => {
            result.current.stopRecording();
        });

        expect(result.current.isRecording).toBe(false);
        expect(result.current.audioBlob).toBeInstanceOf(Blob);
        expect(result.current.recordingTime).toBe(3); // time is preserved after stop
        expect(recorderState.tracks[0].stop).toHaveBeenCalled();
    });

    it('cancels recording and resets states', async () => {
        const { result } = renderHook(() => useAudioRecorder());

        await act(async () => {
            await result.current.startRecording();
        });

        act(() => {
            vi.advanceTimersByTime(2000);
            result.current.cancelRecording();
        });

        expect(result.current.isRecording).toBe(false);
        expect(result.current.recordingTime).toBe(0);
        expect(result.current.audioBlob).toBeNull();
        expect(recorderState.tracks[0].stop).toHaveBeenCalled();
    });

    it('handles permission denial / userMedia failure', async () => {
        recorderState.getUserMedia.mockRejectedValue(new Error('Permission denied'));

        const { result } = renderHook(() => useAudioRecorder());

        await act(async () => {
            await result.current.startRecording();
        });

        expect(result.current.isRecording).toBe(false);
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe('Permission denied');
    });

    it('falls back to default MediaRecorder type when preferred types are unsupported', async () => {
        // Mock supports nothing
        MockMediaRecorder.isTypeSupported.mockReturnValue(false);

        const { result } = renderHook(() => useAudioRecorder());

        await act(async () => {
            await result.current.startRecording();
        });

        expect(result.current.isRecording).toBe(true);
        expect(recorderState.mediaRecorderInstances).toHaveLength(1);
    });
});
