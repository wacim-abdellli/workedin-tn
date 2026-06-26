import { useCallback, useEffect, useState } from 'react';

interface CountdownTick {
    days: number;
    hours: number;
    minutes: number;
    expired: boolean;
}

export function useCountdown(targetIso: string | null | undefined): CountdownTick | null {
    const calc = useCallback(() => {
        if (!targetIso) return null;
        const diff = new Date(targetIso).getTime() - Date.now();
        if (diff <= 0) return { days: 0, hours: 0, minutes: 0, expired: true };
        const totalMin = Math.floor(diff / 60000);
        return { days: Math.floor(totalMin / 1440), hours: Math.floor((totalMin % 1440) / 60), minutes: totalMin % 60, expired: false };
    }, [targetIso]);
    const [tick, setTick] = useState(calc);
    useEffect(() => {
        if (!targetIso) return;
        const id = setInterval(() => setTick(calc()), 60000);
        return () => clearInterval(id);
    }, [targetIso, calc]);
    return tick;
}
