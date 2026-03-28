import React, { useRef, useEffect, useState } from 'react';
import { Send, Paperclip, Loader2, FileText, Download, Check, CheckCheck } from 'lucide-react';
import Button from '../ui/Button';
import { useTranslation } from '../../i18n';
import type { Message } from '../../types';
interface ChatMessage extends Omit<Message, 'sender'> {
    type?: 'text' | 'system'; // System messages like "Contract Started"
    sender?: {
        full_name: string;
        avatar_url?: string | null;
    } | null;
}

interface ChatSectionProps {
    messages: ChatMessage[];
    currentUser: { id: string } | null;
    onSendMessage: (content: string) => Promise<void>;
    onFileUpload: (file: File) => Promise<void>;
    isSending: boolean;
    isUploading: boolean;
    uploadProgress: number;
    otherUserTyping: boolean;
    onTyping: () => void;
    isLoadingHistory: boolean;
}

export default function ChatSection({
    messages,
    currentUser,
    onSendMessage,
    onFileUpload,
    isSending,
    isUploading,
    uploadProgress,
    otherUserTyping,
    onTyping,
    isLoadingHistory
}: ChatSectionProps) {
    const { t } = useTranslation();
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Auto-scroll to bottom
    useEffect(() => {
        scrollToBottom();
    }, [messages, otherUserTyping]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        await onSendMessage(newMessage);
        setNewMessage('');
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await onFileUpload(file);
        }
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateSeparator = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        if (date.toDateString() === today.toDateString()) return t.common?.today || 'Today';
        return date.toLocaleDateString();
    };

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-50/50" role="log" aria-live="polite" aria-relevant="additions text">
                {isLoadingHistory && (
                    <div className="flex justify-center py-4">
                        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                    </div>
                )}

                {messages.length === 0 && !isLoadingHistory ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Send className="w-8 h-8 opacity-50" />
                        </div>
                        <p>{t.contract?.startConversation || 'ابدأ المحادثة الآن'}</p>
                    </div>
                ) : (
                    messages.map((message, index) => {
                        const isOwn = message.sender_id === currentUser?.id;
                        const showDateSeparator = index === 0 ||
                            new Date(message.created_at).toDateString() !== new Date(messages[index - 1].created_at).toDateString();

                        if (message.type === 'system') {
                            return (
                                <div key={message.id} className="flex justify-center my-4">
                                    <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                                        {message.content}
                                    </span>
                                </div>
                            );
                        }

                        return (
                            <div key={message.id}>
                                {showDateSeparator && (
                                    <div className="flex justify-center my-6">
                                        <span className="bg-white border border-gray-200 text-gray-500 text-xs px-3 py-1 rounded-full shadow-sm">
                                            {formatDateSeparator(message.created_at)}
                                        </span>
                                    </div>
                                )}

                                <div className={`flex gap-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                    {!isOwn && (
                                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center shrink-0 self-end mb-1">
                                            {message.sender?.avatar_url ? (
                                                <img src={message.sender.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                                            ) : (
                                                <span className="text-xs font-bold text-primary-700">
                                                    {message.sender?.full_name?.charAt(0)}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className={`flex flex-col max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
                                        <div className={`pk-3 py-2 px-4 rounded-2xl shadow-sm text-sm ${isOwn
                                            ? 'bg-primary-600 text-white rounded-br-sm'
                                            : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
                                            }`}>
                                            {/* Text Content */}
                                            {message.content && <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>}

                                            {/* Attachments */}
                                            {message.attachments && message.attachments.length > 0 && (
                                                <div className="mt-2 space-y-2">
                                                    {message.attachments.map((file, idx) => (
                                                        <div key={idx} className={`flex items-center gap-3 p-2 rounded-lg ${isOwn ? 'bg-primary-700/50' : 'bg-gray-50 border border-gray-200'
                                                            }`}>
                                                            <div className={`p-2 rounded-lg ${isOwn ? 'bg-white/10' : 'bg-white'}`}>
                                                                <FileText className="w-5 h-5" />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-medium truncate text-xs">{file.name}</p>
                                                                <p className={`text-[10px] ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>{file.size}</p>
                                                            </div>
                                                            <a
                                                                href={file.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={`p-1.5 rounded-full transition-colors ${isOwn ? 'hover:bg-white/20' : 'hover:bg-gray-100'
                                                                    }`}
                                                                aria-label={`تحميل المرفق: ${file.name}`}
                                                            >
                                                                <Download className="w-4 h-4" />
                                                            </a>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Meta: Time & Read Receipt */}
                                        <div className="flex items-center gap-1 mt-1 px-1">
                                            <span className="text-[10px] text-gray-400">
                                                {formatTime(message.created_at)}
                                            </span>
                                            {isOwn && (
                                                message.is_read
                                                    ? <CheckCheck className="w-3 h-3 text-blue-500" />
                                                    : <Check className="w-3 h-3 text-gray-300" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Typing Indicator */}
                {otherUserTyping && (
                    <div className="flex justify-start gap-3" role="status" aria-live="polite">
                        <span className="sr-only">الطرف الآخر يكتب الآن</span>
                        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                        <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                {isUploading && (
                    <div className="mb-3" role="status" aria-live="polite">
                        <div className="flex items-center justify-between text-xs text-primary-600 mb-1">
                            <span>جاري رفع الملف...</span>
                            <span>{Math.round(uploadProgress)}%</span>
                        </div>
                        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-primary-600 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                        </div>
                    </div>
                )}

                <form onSubmit={handleSend} className="flex gap-2 items-end">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                        multiple={false} // Start with single file for simplicity
                    />

                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                        disabled={isUploading}
                        aria-label={t.contract?.attachFile || 'إرفاق ملف'}
                    >
                        <Paperclip className="w-5 h-5" />
                    </button>

                    <div className="flex-1 min-h-[48px] bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-primary-100 focus-within:border-primary-400 transition-all">
                        <textarea
                            value={newMessage}
                            onChange={(e) => {
                                setNewMessage(e.target.value);
                                onTyping();
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend(e);
                                }
                            }}
                            placeholder={t.contract?.typeMessage || "اكتب رسالتك هنا..."}
                            className="w-full max-h-32 bg-transparent border-none focus:ring-0 p-0 text-sm resize-none scrollbar-hide my-auto"
                            rows={1}
                            style={{ minHeight: '24px' }}
                            aria-label={t.contract?.typeMessage || "اكتب رسالتك هنا..."}
                        />
                    </div>

                    <Button
                        type="submit"
                        variant="primary"
                        className="h-[48px] w-[48px] p-0 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-primary-200"
                        disabled={!newMessage.trim() || isSending}
                        isLoading={isSending}
                        aria-label={t.contract?.sendMessage || 'إرسال الرسالة'}
                    >
                        <Send className="ms-1 w-5 h-5 rtl:rotate-180" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
