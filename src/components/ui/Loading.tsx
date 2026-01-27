

interface LoadingProps {
    fullScreen?: boolean;
    text?: string;
}

export default function Loading({ fullScreen = false, text }: LoadingProps) {
    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-dark-900/80 backdrop-blur-sm transition-all duration-300">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full border-4 border-primary-100 dark:border-primary-900/30"></div>
                    <div className="absolute top-0 start-0 w-16 h-16 rounded-full border-4 border-t-primary-600 border-e-transparent border-b-transparent border-l-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-primary-600/10 dark:bg-primary-400/10 blur-xl animate-pulse"></div>
                    </div>
                </div>
                {text && (
                    <p className="mt-6 text-dark-500 dark:text-dark-300 font-medium animate-pulse">
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
