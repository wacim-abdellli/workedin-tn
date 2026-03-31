const fs = require('fs');
const file = 'src/hooks/useRealtimeChat.ts';
let content = fs.readFileSync(file, 'utf8');

// Update ChatMessage interface
content = content.replace(
    /interface ChatMessage extends Omit<Message, 'sender'> \{/,
    `interface ChatMessage extends Omit<Message, 'sender'> {
    status?: 'sending' | 'sent' | 'error';`
);

// Update sendMessage
const sendMessageReplacement = `
    const sendMessage = useCallback(
        async (content: string, receiverId: string, attachments?: MessageAttachment[]) => {
            if (!content.trim() && (!attachments || attachments.length === 0)) return;
            if (!contractId || !userId || !receiverId) return;

            const optimisticId = 'temp-' + Date.now();
            const optimisticMsg: ChatMessage = {
                id: optimisticId,
                contract_id: contractId,
                sender_id: userId,
                receiver_id: receiverId,
                content: content.trim(),
                attachments: attachments || [],
                created_at: new Date().toISOString(),
                is_read: false,
                status: 'sending'
            };

            setMessages(prev => [...prev, optimisticMsg]);
            setIsSending(true);

            let attempt = 0;
            const maxRetries = 3;

            while (attempt < maxRetries) {
                try {
                    const { error: insertError } = await sendMessageRecord({
                        contract_id: contractId,
                        sender_id: userId,
                        receiver_id: receiverId,
                        content: content.trim(),
                        attachments: attachments || [],
                    });

                    if (insertError) throw insertError;
                    
                    // Success! Remove optimistic message since Realtime will duplicate it
                    setMessages(prev => prev.filter(m => m.id !== optimisticId));
                    break;
                } catch (err) {
                    attempt++;
                    if (attempt >= maxRetries) {
                        logger.error('Error sending message:', err);
                        setMessages(prev => 
                            prev.map(m => m.id === optimisticId ? { ...m, status: 'error' } : m)
                        );
                        break;
                    }
                    // Exponential backoff
                    await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
                }
            }
            
            setIsSending(false);
        },
        [contractId, userId]
    );`;

content = content.replace(
    /const sendMessage = useCallback\([\s\S]*?\[contractId, userId\]\s*\);/,
    sendMessageReplacement.trim()
);

fs.writeFileSync(file, content);
console.log('Optimistic messaging implemented');
