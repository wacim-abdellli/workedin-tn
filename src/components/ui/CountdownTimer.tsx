import { useEffect, useState } from 'react';

interface CountdownTimerProps {
    targetDate: string | Date;
    onExpire?: () => void;
    className?: string;
    showSeconds?: boolean;
}

export default function CountdownTimer({
    targetDate,
    onExpire,
    className = '',
    showSeconds = true,
}: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState<string>('');

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = new Date(targetDate).getTime() - Date.now();
            
            if (difference <= 0) {
                if (onExpire) {
                    onExpire();
                }
                return 'Expired';
            }

            const hours = Math.floor(difference / (1000 * 60 * 60));
            const minutes = Math.floor((difference / (1000 * 60)) % 60);
            
            if (showSeconds) {
                const seconds = Math.floor((difference / 1000) % 60);
                return `${hours}h ${minutes}m ${seconds}s`;
            }
            
            return `${hours}h ${minutes}m`;
        };

        // Initial set
        setTimeLeft(calculateTimeLeft());

        const interval = setInterval(() => {
            const nextTime = calculateTimeLeft();
            setTimeLeft(nextTime);
            if (nextTime === 'Expired') {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [targetDate, onExpire, showSeconds]);

    return (
        <span className={`font-mono font-bold text-amber-400 select-all ${className}`}>
            {timeLeft}
        </span>
    );
}
