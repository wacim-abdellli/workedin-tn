// Helper functions for offline file handling
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

export const base64ToFile = (base64: string, filename: string, mimeType: string): File => {
    const arr = base64.split(',');
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mimeType });
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

export const normalizeMimeType = (mimeType: string | null | undefined) => (
    (mimeType || '').split(';')[0].trim().toLowerCase()
);

export const canonicalizeVoiceMimeType = (mimeType: string | null | undefined) => {
    const normalized = normalizeMimeType(mimeType);

    if (!normalized) return 'audio/webm';

    if (normalized === 'audio/x-wav' || normalized === 'audio/wav') return 'audio/wav';
    if (['audio/mp3', 'audio/x-mp3', 'audio/x-mpeg', 'audio/mpeg'].includes(normalized)) return 'audio/mpeg';
    if (['audio/x-m4a', 'audio/m4a', 'audio/mp4a-latm', 'audio/aac', 'audio/mp4', 'video/mp4'].includes(normalized)) return 'audio/mp4';
    if (normalized === 'audio/ogg' || normalized === 'video/ogg') return 'audio/ogg';
    if (normalized === 'audio/webm' || normalized === 'video/webm') return 'audio/webm';

    return normalized.startsWith('audio/') ? normalized : 'audio/webm';
};

export const getAudioExtensionFromMimeType = (mimeType: string) => {
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

export const buildVoiceMemoFile = (audio: Blob, timestamp: number = Date.now()) => {
    const canonicalMimeType = canonicalizeVoiceMimeType(audio.type);
    const extension = getAudioExtensionFromMimeType(canonicalMimeType);
    const fileName = `voice_memo_${timestamp}.${extension}`;

    return {
        fileName,
        mimeType: canonicalMimeType,
        file: new File([audio], fileName, { type: canonicalMimeType }),
    };
};

export const hasSignature = (bytes: Uint8Array, signature: number[], offset = 0) => {
    if (bytes.length < offset + signature.length) return false;
    return signature.every((value, index) => bytes[offset + index] === value);
};

export const detectAudioMimeTypeFromBuffer = (buffer: ArrayBuffer): string | null => {
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 4) return null;

    if (hasSignature(bytes, [0x1a, 0x45, 0xdf, 0xa3])) return 'audio/webm';
    if (hasSignature(bytes, [0x52, 0x49, 0x46, 0x46]) && hasSignature(bytes, [0x57, 0x41, 0x56, 0x45], 8)) return 'audio/wav';
    if (hasSignature(bytes, [0x4f, 0x67, 0x67, 0x53])) return 'audio/ogg';
    if (hasSignature(bytes, [0x49, 0x44, 0x33]) || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)) return 'audio/mpeg';
    if (hasSignature(bytes, [0x66, 0x74, 0x79, 0x70], 4)) return 'audio/mp4';

    return null;
};

export const inferAudioMimeType = (mimeType: string | null | undefined, fileName: string | null | undefined) => {
    const normalized = normalizeMimeType(mimeType);
    if (normalized.startsWith('audio/')) return normalized;

    const lowerName = String(fileName || '').toLowerCase();
    if (lowerName.endsWith('.mp3')) return 'audio/mpeg';
    if (lowerName.endsWith('.wav')) return 'audio/wav';
    if (lowerName.endsWith('.ogg')) return 'audio/ogg';
    if (lowerName.endsWith('.m4a')) return 'audio/mp4';
    return 'audio/webm';
};

export const formatAudioTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
};
