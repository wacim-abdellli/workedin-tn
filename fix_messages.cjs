const fs = require('fs');
let code = fs.readFileSync('src/services/messages.ts', 'utf8');

const regex = /export function subscribeToConversations\([\s\S]*?return channel;\s*\}/g;

const newCode = `export function subscribeToConversations(
    userId: string,
    callback: (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void
): RealtimeChannel {
    const channel = supabase.channel(\`conversations:\${userId}\`);

    channel.on(
        'postgres_changes',
        {
            event: '*',
            schema: 'public',
            table: 'conversations',
        },
        (payload) => {
            const newRecord = payload.new as any;
            const oldRecord = payload.old as any;
            const isParticipant =
                (newRecord && (newRecord.participant_1 === userId || newRecord.participant_2 === userId)) ||
                (oldRecord && (oldRecord.participant_1 === userId || oldRecord.participant_2 === userId));
                
            if (isParticipant) callback(payload);
        }
    );

    channel.subscribe();

    return channel;
}`;

code = code.replace(regex, newCode);
fs.writeFileSync('src/services/messages.ts', code);
