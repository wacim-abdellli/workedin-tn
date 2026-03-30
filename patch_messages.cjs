const fs = require('fs');
let content = fs.readFileSync('src/pages/Messages.tsx', 'utf8');

// Imports
if (!content.includes('Mic,')) {
    content = content.replace('Loader2,\n} from \'lucide-react\';', 'Loader2,\n    Mic,\n    Square,\n    X,\n    FileAudio,\n    Image as ImageIcon,\n} from \'lucide-react\';');
    content = content.replace('Loader2,\r\n} from \'lucide-react\';', 'Loader2,\r\n    Mic,\r\n    Square,\r\n    X,\r\n    FileAudio,\r\n    Image as ImageIcon,\r\n} from \'lucide-react\';');
}
if (!content.includes('uploadMessageAttachment')) {
    content = content.replace('sendMessage,', 'sendMessage,\n    uploadMessageAttachment,');
    content = content.replace('sendMessage,\r', 'sendMessage,\r\n    uploadMessageAttachment,\r');
}
if (!content.includes('useAudioRecorder')) {
    content = content.replace("import type { RealtimeChannel } from '@supabase/supabase-js';", "import type { RealtimeChannel } from '@supabase/supabase-js';\nimport { useAudioRecorder } from '../hooks/useAudioRecorder';");
}

// State
if (!content.includes('fileInputRef')) {
    content = content.replace('const [isSending, setIsSending] = useState(false);', 'const [isSending, setIsSending] = useState(false);\n    const fileInputRef = useRef<HTMLInputElement>(null);\n    const [selectedFile, setSelectedFile] = useState<File | null>(null);\n    const { isRecording, recordingTime, startRecording, stopRecording, cancelRecording, audioBlob } = useAudioRecorder();');
}

// Function
const oldFn = `    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation || !user) return;

        setIsSending(true);

        const { data, error } = await sendMessage({
            conversationId: selectedConversation.id,
            senderId: user.id,
            receiverId: selectedConversation.otherUser.id,
            content: newMessage.trim(),
            contractId: selectedConversation.contract_id,
        });

        if (error) {
            showToast(error.message, 'error');
        } else if (data) {
            // Message will be added via realtime subscription
            setNewMessage('');
        }

        setIsSending(false);
    };`;

const newFn = `    const handleSendMessage = async () => {
        if ((!newMessage.trim() && !selectedFile && !audioBlob) || !selectedConversation || !user) return;

        setIsSending(true);

        const attachments = [];

        if (audioBlob) {
            const fileName = \`voice_memo_\${Date.now()}.webm\`;
            const audioFile = new File([audioBlob], fileName, { type: audioBlob.type || 'audio/webm' });
            const { url, error } = await uploadMessageAttachment(audioFile, selectedConversation.id);
            if (error) {
                 showToast('Failed to upload audio: ' + error.message, 'error');
                 setIsSending(false);
                 return;
            }
            if (url) attachments.push({ name: 'Voice Memo', url, type: audioFile.type, size: audioFile.size });
            cancelRecording();
        }

        if (selectedFile) {
            const { url, error } = await uploadMessageAttachment(selectedFile, selectedConversation.id);
            if (error) {
                 showToast('Failed to upload file: ' + error.message, 'error');
                 setIsSending(false);
                 return;
            }
            if (url) attachments.push({ name: selectedFile.name, url, type: selectedFile.type, size: selectedFile.size });
            setSelectedFile(null);
        }

        const { data, error } = await sendMessage({
            conversationId: selectedConversation.id,
            senderId: user.id,
            receiverId: selectedConversation.otherUser.id,
            content: newMessage.trim(),
            contractId: selectedConversation.contract_id,
            attachments: attachments.length > 0 ? attachments : undefined
        });

        if (error) {
            showToast(error.message, 'error');
        } else if (data) {
            setNewMessage('');
        }
        setIsSending(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                showToast('حجم الملف يجب أن يكون أقل من 10 ميغابايت', 'error');
                return;
            }
            setSelectedFile(file);
        }
    };`;

// normalize everything to \n for replacement
let normContent = content.replace(/\r\n/g, '\n');
if (normContent.includes('if (!newMessage.trim() || !selectedConversation || !user) return;')) {
    normContent = normContent.replace(oldFn, newFn);
}

// Rendering
const oldRender = `                                        {message.attachments && message.attachments.length > 0 && (
                                            <div className="mt-2 space-y-2">
                                                {message.attachments.map((att, i) => (
                                                    <div
                                                        key={i}
                                                        className={\`flex items-center gap-2 p-2 rounded-lg \${
                                                            message.sender_id === user?.id
                                                                ? 'bg-primary-700'
                                                                : 'bg-secondary'
                                                        }\`}
                                                    >
                                                        <FileText className="w-4 h-4" />
                                                        <span className="text-sm flex-1">{att.name}</span>
                                                        <span className="text-xs opacity-70">{att.size}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}`;

const newRender = `                                        {message.attachments && message.attachments.length > 0 && (
                                            <div className="mt-2 space-y-2">
                                                {message.attachments.map((att, i) => {
                                                    const isImage = att.type?.startsWith('image/');
                                                    const isAudio = att.type?.startsWith('audio/');
                                                    
                                                    if (isImage) {
                                                        return (
                                                            <a key={i} href={att.url} target="_blank" rel="noopener noreferrer" className="block max-w-[250px] sm:max-w-xs transition-opacity hover:opacity-90">
                                                                <img src={att.url} alt={att.name} className="w-full h-auto rounded-lg object-cover" />
                                                            </a>
                                                        );
                                                    }
                                                    
                                                    if (isAudio) {
                                                        return (
                                                            <audio key={i} controls src={att.url} className="w-full max-w-[250px] h-11" />
                                                        );
                                                    }

                                                    return (
                                                        <a
                                                            key={i}
                                                            href={att.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className={\`flex items-center gap-2 p-2.5 rounded-xl transition-colors \${
                                                                message.sender_id === user?.id
                                                                    ? 'bg-primary-700 hover:bg-primary-800 text-white'
                                                                    : 'bg-secondary hover:bg-secondary-hover text-foreground'
                                                            }\`}
                                                        >
                                                            <FileText className="w-5 h-5 shrink-0" />
                                                            <div className="flex flex-col min-w-0 flex-1">
                                                                <span className="text-sm font-medium truncate">{att.name}</span>
                                                            </div>
                                                        </a>
                                                    );
                                                })}
                                            </div>
                                        )}`;

if (normContent.includes('message.attachments.map((att, i) => (')) {
    normContent = normContent.replace(oldRender, newRender);
}

// Input Area
const oldInput = `                    {/* Input */}
                    <div className="p-4 border-t border-border bg-card">
                        <div className="flex items-center gap-3">
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg text-muted" disabled>
                                <Paperclip className="w-5 h-5" />
                            </button>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                placeholder="اكتب رسالتك..."
                                disabled={isSending}
                                className="flex-1 px-4 py-2.5 border border-border rounded-xl bg-card text-foreground focus:ring-2 focus:ring-primary-100 focus:border-primary-500 disabled:opacity-50"
                            />
                            <Button
                                variant="primary"
                                onClick={handleSendMessage}
                                disabled={!newMessage.trim() || isSending}
                                isLoading={isSending}
                                className="shrink-0"
                            >
                                <Send className="w-5 h-5 rtl:rotate-180" />
                            </Button>
                        </div>
                    </div>`;

const newInput = `                    {/* Previews */}
                    {(selectedFile || audioBlob || isRecording) && (
                        <div className="p-3 border-t border-border bg-card">
                            {isRecording ? (
                                <div className="flex items-center justify-between bg-red-50 dark:bg-red-900/10 rounded-xl p-3 border border-red-100 dark:border-red-900/30">
                                    <div className="flex items-center gap-3 text-red-500">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                                        <span className="text-sm font-medium">جاري التسجيل... 00:{recordingTime.toString().padStart(2, '0')}</span>
                                    </div>
                                    <button onClick={stopRecording} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                                        <Square className="w-4 h-4 fill-current" />
                                    </button>
                                </div>
                            ) : audioBlob ? (
                                <div className="flex items-center gap-3 bg-secondary rounded-xl p-3 border border-border">
                                    <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                        <FileAudio className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="text-sm font-medium truncate">رسالة صوتية</span>
                                        <span className="text-xs text-muted">00:{recordingTime.toString().padStart(2, '0')}</span>
                                    </div>
                                    <button onClick={cancelRecording} className="p-2 text-muted hover:text-foreground hover:bg-background rounded-lg transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : selectedFile ? (
                                <div className="flex items-center gap-3 bg-secondary rounded-xl p-3 border border-border">
                                    <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                        {selectedFile.type.startsWith('image/') ? <ImageIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" /> : <FileText className="w-5 h-5 text-primary-600 dark:text-primary-400" />}
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className="text-sm font-medium truncate">{selectedFile.name}</span>
                                        <span className="text-xs text-muted">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                    <button onClick={() => setSelectedFile(null)} className="p-2 text-muted hover:text-foreground hover:bg-background rounded-lg transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* Input */}
                    <div className="p-3 sm:p-4 border-t border-border bg-card">
                        <div className="flex flex-wrap sm:flex-nowrap items-end gap-2 sm:gap-3">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileChange}
                                accept="image/*,application/pdf,.doc,.docx"
                            />
                            
                            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                                {!isRecording && !audioBlob && (
                                    <button 
                                        className="p-2.5 sm:p-3 hover:bg-secondary rounded-xl text-muted hover:text-foreground transition-colors" 
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isSending || !!selectedFile}
                                        title="إرفاق ملف"
                                    >
                                        <Paperclip className="w-5 h-5" />
                                    </button>
                                )}
                                
                                {!selectedFile && !audioBlob && (
                                    <button 
                                        className={\`p-2.5 sm:p-3 rounded-xl transition-colors \${isRecording ? 'bg-red-500 text-white animate-pulse' : 'hover:bg-secondary text-muted hover:text-foreground'}\`}
                                        onClick={isRecording ? stopRecording : startRecording}
                                        disabled={isSending}
                                        title={isRecording ? 'إيقاف التسجيل' : 'تسجيل مقطع صوتي'}
                                    >
                                        {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 bg-secondary rounded-xl py-1 px-2 border border-border focus-within:ring-2 focus-within:ring-primary-100 focus-within:border-primary-500 transition-all flex items-center min-h-[46px] sm:min-h-[50px]">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                                    placeholder="اكتب رسالتك..."
                                    disabled={isSending || isRecording || !!selectedFile || !!audioBlob}
                                    className="w-full bg-transparent border-none focus:ring-0 text-foreground text-sm py-2 px-2 disabled:opacity-50"
                                />
                            </div>

                            <Button
                                variant="primary"
                                onClick={handleSendMessage}
                                disabled={(!newMessage.trim() && !selectedFile && !audioBlob) || isSending || isRecording}
                                isLoading={isSending}
                                className="shrink-0 h-[46px] w-[46px] sm:h-[50px] sm:w-[50px] rounded-xl p-0 flex items-center justify-center shadow-sm"
                            >
                                <Send className="w-5 h-5 rtl:rotate-180" />
                            </Button>
                        </div>
                    </div>`;

if (normContent.includes('placeholder="اكتب رسالتك..."')) {
    normContent = normContent.replace(oldInput, newInput);
}

fs.writeFileSync('src/pages/Messages.tsx', normContent);
console.log('Patch complete. Files modified.');
