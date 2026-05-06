import { createClient } from '@supabase/supabase-js';

const getDayWindow = (date = new Date()) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    
    const daysSinceEpoch = Math.floor(dayStart.getTime() / 86400000);
    if (daysSinceEpoch % 2 !== 0) {
        dayStart.setDate(dayStart.getDate() - 1);
    }
    
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 2);
    
    return { dayStart, dayEnd };
};

const window = getDayWindow();
console.log("Start:", window.dayStart);
console.log("End:", window.dayEnd);
