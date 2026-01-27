import { Loader2 } from 'lucide-react';

interface LoadingProps {
    fullScreen?: boolean;
    text?: string;
}

export default function Loading({ fullScreen = false, text }: LoadingProps) {
    if (fullScreen) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 bg-opacity-80">
                <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-4" />
                {text && <p className="text-muted font-medium">{text}</p>}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin mb-3" />
            {text && <p className="text-sm text-muted">{text}</p>}
        </div>
    );
}
