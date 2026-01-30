

interface LoadingProps {
    fullScreen?: boolean;
    text?: string;
}

export default function Loading({ fullScreen = false, text }: LoadingProps) {
    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-md transition-all duration-300">
                <div className="relative">
                    {/* Outer glow */}
                    <div className="absolute inset-0 bg-primary-500/20 blur-xl rounded-full animate-pulse"></div>

                    {/* Spinner */}
                    <div className="relative w-20 h-20">
                        <div className="absolute inset-0 border-4 border-primary-200/30 dark:border-primary-900/30 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-primary-600 border-t-transparent border-l-transparent rounded-full animate-spin"></div>

                        {/* Center dot */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-3 h-3 bg-primary-600 rounded-full animate-ping"></div>
                        </div>
                    </div>
                </div>
                {text && (
                    <p className="mt-8 text-gray-600 dark:text-gray-300 font-medium tracking-wide animate-pulse">
                        {text}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="relative w-10 h-10">
                <div className="absolute inset-0 border-4 border-primary-200 dark:border-primary-900/50 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            {text && <p className="mt-4 text-sm text-dark-500 dark:text-dark-400 font-medium">{text}</p>}
        </div>
    );
}
