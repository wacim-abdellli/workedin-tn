import React, { useRef } from 'react';
import { Mic, Paperclip, Send, Square, X, FileText } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/i18n';

interface ChatInputAreaProps {
    value: string;
    onChange: (val: string) => void;
    onSend: () => void;
    isSending: boolean;
    isRecording: boolean;
    onToggleRecord: () => void;
    onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    selectedFiles: File[];
    onRemoveFile: (index: number) => void;
    placeholder?: string;
    disabled?: boolean;
    onTypingStart?: () => void;
    onTypingStop?: () => void;
    canAttachFiles?: boolean;
    canRecordAudio?: boolean;
}

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
    value,
    onChange,
    onSend,
    isSending,
    isRecording,
    onToggleRecord,
    onFileSelect,
    selectedFiles,
    onRemoveFile,
    placeholder = 'Type a message...',
    disabled = false,
    onTypingStart,
    onTypingStop,
    canAttachFiles = true,
    canRecordAudio = true,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { tx } = useTranslation();

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onTypingStop?.();
            onSend();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value);
        if (e.target.value.trim()) {
            onTypingStart?.();
        } else {
            onTypingStop?.();
        }

        e.currentTarget.style.height = '36px';
        e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 112)}px`;
    };

    const activePlaceholder = isRecording 
        ? tx('messages.recording', undefined, 'Recording...') 
        : (placeholder === 'Type a message...' ? tx('messages.messagePlaceholder', undefined, 'Write your message...') : placeholder);

    return (
        <div className="flex flex-col gap-2 bg-transparent">
            {/* Selected Files Preview */}
            <AnimatePresence>
                {selectedFiles.length > 0 && (
                    <m.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap gap-2"
                    >
                        {selectedFiles.map((file, i) => (
                            <div key={i} className="flex items-center gap-2 rounded-[10px] border border-white/[0.06] bg-white/[0.025] px-2.5 py-1.5 transition-all hover:bg-white/[0.04]">
                                <FileText className="h-3.5 w-3.5 text-zinc-400" />
                                <span className="max-w-[140px] truncate text-[11px] text-zinc-300">{file.name}</span>
                                <button 
                                    onClick={() => onRemoveFile(i)} 
                                    className="p-1 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </m.div>
                )}
            </AnimatePresence>

            <div className="flex items-end gap-1.5 rounded-[16px] border border-white/[0.08] bg-[#0b0b0d]/90 p-1.5 transition-all duration-200 focus-within:border-[var(--workspace-primary)]/45 focus-within:ring-1 focus-within:ring-[var(--workspace-primary)]/20">
                {/* File Attachment */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    multiple 
                    onChange={onFileSelect}
                    accept="image/*,application/pdf,audio/*,video/*,.doc,.docx,.txt"
                />
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || isSending || isRecording || !canAttachFiles}
                    aria-label={tx('messages.attachFile', undefined, 'Attach file')}
                    className="rounded-[12px] p-2 text-zinc-400 transition-all hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
                >
                    <Paperclip className="h-4 w-4 transition-colors" />
                </button>

                {/* Audio Recording */}
                <button
                    onClick={onToggleRecord}
                    disabled={disabled || isSending || !canRecordAudio}
                    aria-label={isRecording ? tx('messages.stopRecording', undefined, 'Stop recording') : tx('messages.recordVoice', undefined, 'Record voice message')}
                    className={`rounded-[12px] p-2 transition-all disabled:opacity-50 ${isRecording ? 'bg-red-500/20 text-red-400' : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'}`}
                >
                    {isRecording ? <Square className="h-4 w-4 fill-current animate-pulse" /> : <Mic className="h-4 w-4 transition-colors" />}
                </button>

                {/* Text Input */}
                <textarea
                    ref={textareaRef}
                    id="messages-thread-composer-input"
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onBlur={onTypingStop}
                    placeholder={activePlaceholder}
                    disabled={disabled || isSending || isRecording}
                    rows={1}
                    className="min-h-[36px] flex-1 resize-none border-0 bg-transparent px-2 py-2 text-[13.5px] text-white placeholder-zinc-500 outline-none ring-0 focus:outline-none focus:ring-0 disabled:opacity-50"
                />

                {/* Send Button */}
                <button
                    onClick={() => {
                        onTypingStop?.();
                        onSend();
                    }}
                    aria-label={tx('contract.send', undefined, 'Send message')}
                    disabled={disabled || isSending || (!value.trim() && selectedFiles.length === 0)}
                    className="rounded-[12px] p-2 text-white transition-all duration-200 hover:scale-[1.03] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                    style={{ 
                        backgroundColor: (value.trim() || selectedFiles.length > 0) ? 'var(--workspace-primary)' : 'rgba(255,255,255,0.03)', 
                    }}
                >
                    {isSending ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </button>
            </div>
        </div>
    );
};
