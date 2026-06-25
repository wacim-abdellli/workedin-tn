import { describe, expect, it } from 'vitest';
import { getAvatarGradient, getInitials, resolveAccountAvatarUrl } from '@/lib/avatar';
import {
    canTransitionContractStatus,
    hasRecordedDeliveryEvidence,
    getStatusAfterDelivery,
    canFreelancerDeliverForStatus,
    canClientAcceptForStatus,
    canClientRequestChangesForStatus,
    canOpenDisputeForStatus,
} from '@/lib/contractWorkflow';
import {
    normalizeMimeType,
    canonicalizeVoiceMimeType,
    getAudioExtensionFromMimeType,
    buildVoiceMemoFile,
    hasSignature,
    detectAudioMimeTypeFromBuffer,
    inferAudioMimeType,
    formatAudioTime,
} from '@/lib/audioProcessing';
import { localizeGovernorate, getLocalizedGovernorateOptions } from '@/lib/governorates';

describe('avatar', () => {
    it('getAvatarGradient returns a 2-color tuple', () => {
        const gradient = getAvatarGradient('Alice');
        expect(gradient).toHaveLength(2);
        expect(gradient[0]).toMatch(/^#/);
        expect(gradient[1]).toMatch(/^#/);
    });

    it('getAvatarGradient handles empty string', () => {
        const gradient = getAvatarGradient('');
        expect(gradient).toHaveLength(2);
    });

    it('getInitials returns first 2 initials', () => {
        expect(getInitials('Alice Bob')).toBe('AB');
    });

    it('getInitials handles single name', () => {
        expect(getInitials('Alice')).toBe('A');
    });

    it('getInitials handles empty string', () => {
        expect(getInitials('')).toBe('K');
    });

    it('getInitials handles extra spaces', () => {
        expect(getInitials('  Alice   Bob  ')).toBe('AB');
    });

    it('resolveAccountAvatarUrl returns url when valid', () => {
        expect(resolveAccountAvatarUrl('https://example.com/avatar.png')).toBe('https://example.com/avatar.png');
    });

    it('resolveAccountAvatarUrl returns null when avatarFailed', () => {
        expect(resolveAccountAvatarUrl('https://example.com/avatar.png', true)).toBeNull();
    });

    it('resolveAccountAvatarUrl returns null for empty url', () => {
        expect(resolveAccountAvatarUrl(null)).toBeNull();
        expect(resolveAccountAvatarUrl(undefined)).toBeNull();
    });
});

describe('contractWorkflow', () => {
    it('canTransitionContractStatus allows valid transitions', () => {
        expect(canTransitionContractStatus('pending_payment', 'active')).toBe(true);
        expect(canTransitionContractStatus('active', 'delivery_submitted')).toBe(true);
        expect(canTransitionContractStatus('delivery_submitted', 'completed')).toBe(true);
        expect(canTransitionContractStatus('delivery_submitted', 'revision_requested')).toBe(true);
    });

    it('canTransitionContractStatus rejects invalid transitions', () => {
        expect(canTransitionContractStatus('completed', 'active')).toBe(false);
        expect(canTransitionContractStatus('cancelled', 'active')).toBe(false);
        expect(canTransitionContractStatus('pending_payment', 'completed')).toBe(false);
    });

    it('canTransitionContractStatus returns false for null/undefined', () => {
        expect(canTransitionContractStatus(null, 'active')).toBe(false);
        expect(canTransitionContractStatus(undefined, 'active')).toBe(false);
    });

    it('hasRecordedDeliveryEvidence returns true for non-empty strings', () => {
        expect(hasRecordedDeliveryEvidence('delivered')).toBe(true);
        expect(hasRecordedDeliveryEvidence('  notes  ')).toBe(true);
    });

    it('hasRecordedDeliveryEvidence returns false for empty/null', () => {
        expect(hasRecordedDeliveryEvidence(null)).toBe(false);
        expect(hasRecordedDeliveryEvidence(undefined)).toBe(false);
        expect(hasRecordedDeliveryEvidence('')).toBe(false);
        expect(hasRecordedDeliveryEvidence('   ')).toBe(false);
    });

    it('getStatusAfterDelivery returns delivery_submitted for active/revision', () => {
        expect(getStatusAfterDelivery('active')).toBe('delivery_submitted');
        expect(getStatusAfterDelivery('revision_requested')).toBe('delivery_submitted');
    });

    it('getStatusAfterDelivery returns null for other statuses', () => {
        expect(getStatusAfterDelivery('completed')).toBeNull();
        expect(getStatusAfterDelivery(null)).toBeNull();
    });

    it('canFreelancerDeliverForStatus matches active/revision', () => {
        expect(canFreelancerDeliverForStatus('active')).toBe(true);
        expect(canFreelancerDeliverForStatus('revision_requested')).toBe(true);
        expect(canFreelancerDeliverForStatus('completed')).toBe(false);
    });

    it('canClientAcceptForStatus requires delivery_submitted + evidence', () => {
        expect(canClientAcceptForStatus('delivery_submitted', true)).toBe(true);
        expect(canClientAcceptForStatus('delivery_submitted', false)).toBe(false);
        expect(canClientAcceptForStatus('active', true)).toBe(false);
    });

    it('canClientRequestChangesForStatus requires delivery_submitted + evidence', () => {
        expect(canClientRequestChangesForStatus('delivery_submitted', true)).toBe(true);
        expect(canClientRequestChangesForStatus('active', true)).toBe(false);
    });

    it('canOpenDisputeForStatus allows pending/active/delivery/revision', () => {
        expect(canOpenDisputeForStatus('pending_payment')).toBe(true);
        expect(canOpenDisputeForStatus('active')).toBe(true);
        expect(canOpenDisputeForStatus('delivery_submitted')).toBe(true);
        expect(canOpenDisputeForStatus('revision_requested')).toBe(true);
        expect(canOpenDisputeForStatus('completed')).toBe(false);
        expect(canOpenDisputeForStatus('cancelled')).toBe(false);
    });
});

describe('audioProcessing', () => {
    it('normalizeMimeType strips parameters and lowercases', () => {
        expect(normalizeMimeType('Audio/WebM; charset=utf-8')).toBe('audio/webm');
        expect(normalizeMimeType(null)).toBe('');
        expect(normalizeMimeType(undefined)).toBe('');
    });

    it('canonicalizeVoiceMimeType normalizes known types', () => {
        expect(canonicalizeVoiceMimeType('audio/x-wav')).toBe('audio/wav');
        expect(canonicalizeVoiceMimeType('audio/wav')).toBe('audio/wav');
        expect(canonicalizeVoiceMimeType('audio/mp3')).toBe('audio/mpeg');
        expect(canonicalizeVoiceMimeType('audio/m4a')).toBe('audio/mp4');
        expect(canonicalizeVoiceMimeType('audio/ogg')).toBe('audio/ogg');
        expect(canonicalizeVoiceMimeType('video/mp4')).toBe('audio/mp4');
        expect(canonicalizeVoiceMimeType('video/webm')).toBe('audio/webm');
        expect(canonicalizeVoiceMimeType(null)).toBe('audio/webm');
        expect(canonicalizeVoiceMimeType('')).toBe('audio/webm');
    });

    it('canonicalizeVoiceMimeType passes through unknown audio types', () => {
        expect(canonicalizeVoiceMimeType('audio/flac')).toBe('audio/flac');
    });

    it('canonicalizeVoiceMimeType falls back for non-audio types', () => {
        expect(canonicalizeVoiceMimeType('video/avi')).toBe('audio/webm');
    });

    it('getAudioExtensionFromMimeType returns correct extensions', () => {
        expect(getAudioExtensionFromMimeType('audio/mp4')).toBe('m4a');
        expect(getAudioExtensionFromMimeType('audio/mpeg')).toBe('mp3');
        expect(getAudioExtensionFromMimeType('audio/wav')).toBe('wav');
        expect(getAudioExtensionFromMimeType('audio/ogg')).toBe('ogg');
        expect(getAudioExtensionFromMimeType('audio/webm')).toBe('webm');
        expect(getAudioExtensionFromMimeType('unknown/type')).toBe('webm');
    });

    it('buildVoiceMemoFile creates a file with correct metadata', () => {
        const blob = new Blob(['test'], { type: 'audio/webm' });
        const result = buildVoiceMemoFile(blob, 12345);
        expect(result.fileName).toBe('voice_memo_12345.webm');
        expect(result.mimeType).toBe('audio/webm');
        expect(result.file).toBeInstanceOf(File);
        expect(result.file.name).toBe('voice_memo_12345.webm');
    });

    it('hasSignature detects byte patterns', () => {
        const bytes = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0x00]);
        expect(hasSignature(bytes, [0x1a, 0x45, 0xdf, 0xa3])).toBe(true);
        expect(hasSignature(bytes, [0x00, 0x00])).toBe(false);
        expect(hasSignature(bytes, [0x1a, 0x45], 0)).toBe(true);
        expect(hasSignature(bytes, [0x1a, 0x45], 10)).toBe(false); // out of bounds
    });

    it('detectAudioMimeTypeFromBuffer identifies formats', () => {
        // WebM header
        const webm = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3]);
        expect(detectAudioMimeTypeFromBuffer(webm.buffer)).toBe('audio/webm');

        // WAV header
        const wav = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45]);
        expect(detectAudioMimeTypeFromBuffer(wav.buffer)).toBe('audio/wav');

        // OGG header
        const ogg = new Uint8Array([0x4f, 0x67, 0x67, 0x53]);
        expect(detectAudioMimeTypeFromBuffer(ogg.buffer)).toBe('audio/ogg');

        // MP3 header (ID3)
        const mp3id3 = new Uint8Array([0x49, 0x44, 0x33, 0x00]);
        expect(detectAudioMimeTypeFromBuffer(mp3id3.buffer)).toBe('audio/mpeg');

        // MP3 header (sync word)
        const mp3sync = new Uint8Array([0xff, 0xfb, 0x90, 0x00]);
        expect(detectAudioMimeTypeFromBuffer(mp3sync.buffer)).toBe('audio/mpeg');

        // Too short
        expect(detectAudioMimeTypeFromBuffer(new Uint8Array([0x00, 0x01]).buffer)).toBeNull();
    });

    it('inferAudioMimeType prefers mime type, then filename, then default', () => {
        expect(inferAudioMimeType('audio/mpeg', null)).toBe('audio/mpeg');
        expect(inferAudioMimeType(null, 'song.mp3')).toBe('audio/mpeg');
        expect(inferAudioMimeType(null, 'recording.wav')).toBe('audio/wav');
        expect(inferAudioMimeType(null, 'audio.ogg')).toBe('audio/ogg');
        expect(inferAudioMimeType(null, 'clip.m4a')).toBe('audio/mp4');
        expect(inferAudioMimeType(null, null)).toBe('audio/webm');
    });

    it('formatAudioTime formats seconds correctly', () => {
        expect(formatAudioTime(0)).toBe('0:00');
        expect(formatAudioTime(65)).toBe('1:05');
        expect(formatAudioTime(3661)).toBe('61:01');
        expect(formatAudioTime(-1)).toBe('0:00');
        expect(formatAudioTime(NaN)).toBe('0:00');
    });
});

describe('governorates', () => {
    it('localizeGovernorate translates Arabic to target language', () => {
        expect(localizeGovernorate('تونس', 'en')).toBe('Tunis');
        expect(localizeGovernorate('تونس', 'fr')).toBe('Tunis');
        expect(localizeGovernorate('تونس', 'ar')).toBe('تونس');
    });

    it('localizeGovernorate handles English input', () => {
        expect(localizeGovernorate('Tunis', 'ar')).toBe('تونس');
        expect(localizeGovernorate('Sfax', 'en')).toBe('Sfax');
    });

    it('localizeGovernorate returns original for unknown', () => {
        expect(localizeGovernorate('Unknown', 'en')).toBe('Unknown');
    });

    it('getLocalizedGovernorateOptions returns all governorates', () => {
        const options = getLocalizedGovernorateOptions('en');
        expect(options.length).toBe(24);
        expect(options[0]).toHaveProperty('value');
        expect(options[0]).toHaveProperty('label');
        expect(options[0].label).toBe('Tunis');
    });
});
