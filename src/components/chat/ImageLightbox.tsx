/**
 * ImageLightbox.tsx
 * Full-screen image preview modal with download.
 * Extracted from Messages.tsx.
 */
import { X, Download } from 'lucide-react';

interface ImageLightboxProps {
    imageUrl: string | null;
    onClose: () => void;
}

export const ImageLightbox = ({ imageUrl, onClose }: ImageLightboxProps) => {
    if (!imageUrl) return null;

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = 'image';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label="Image preview"
        >
            <div
                className="relative max-w-4xl max-h-[90vh] flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="absolute -top-12 -right-12 sm:top-0 sm:right-0 flex items-center gap-2 p-2 z-10">
                    <button
                        type="button"
                        onClick={handleDownload}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                        aria-label="Download image"
                        title="Download"
                    >
                        <Download className="h-6 w-6 text-white" />
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                        aria-label="Close image preview"
                        title="Close"
                    >
                        <X className="h-6 w-6 text-white" />
                    </button>
                </div>

                <img
                    src={imageUrl}
                    alt="Preview"
                    className="max-w-full max-h-[90vh] rounded-xl object-contain"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
            </div>
        </div>
    );
};
