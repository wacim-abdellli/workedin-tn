import React, { useRef, useState } from 'react';
import { Mic, Paperclip, Send, Square, X, FileText } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';

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

        // Auto-resize
        e.currentTarget.style.height = '44px';
        e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 128)}px`;
    };

    return (
        <div className="flex flex-col gap-2 p-4 bg-transparent border-t border-white/[0.04] backdrop-blur-sm">
            {/* Selected Files Preview */}
            <AnimatePresence>
                {selectedFiles.length > 0 && (
                    <m.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-wrap gap-2 mb-2"
                    >
                        {selectedFiles.map((file, i) => (
                            <div key={i} className="flex items-center gap-2 rounded-xl px-3 py-1.5 border border-white/[0.06] bg-white/[0.03] backdrop-blur-md transition-all hover:bg-white/[0.05]">
                                <FileText className="h-4 w-4 text-zinc-400" />
                                <span className="text-xs max-w-[120px] truncate text-zinc-300">{file.name}</span>
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

            <div className="flex items-end gap-2 rounded-2xl border border-white/[0.08] bg-[#0c0c0f]/80 p-1.5 focus-within:border-[var(--workspace-primary)]/50 focus-within:ring-2 focus-within:ring-[var(--workspace-primary)]/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] backdrop-blur-sm transition-all duration-300">
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
                    aria-label="Attach file"
                    className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
                >
                    <Paperclip className="h-5 w-5 transition-colors" />
                </button>

                {/* Audio Recording */}
                <button
                    onClick={onToggleRecord}
                    disabled={disabled || isSending || !canRecordAudio}
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                    className={`p-2.5 rounded-xl transition-all disabled:opacity-50 ${isRecording ? 'bg-red-500/20 text-red-400' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
                >
                    {isRecording ? <Square className="h-5 w-5 fill-current animate-pulse" /> : <Mic className="h-5 w-5 transition-colors" />}
                </button>

                {/* Text Input */}
                <textarea
                    ref={textareaRef}
                    id="messages-thread-composer-input"
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onBlur={onTypingStop}
                    placeholder={isRecording ? 'Recording audio...' : placeholder}
                    disabled={disabled || isSending || isRecording}
                    rows={1}
                    className="flex-1 bg-transparent border-0 ring-0 focus:ring-0 focus:outline-none text-[14px] px-2 py-2.5 text-white placeholder-zinc-500 resize-none max-h-32 min-h-[44px] disabled:opacity-50"
                />

                {/* Send Button */}
                <button
                    onClick={() => {
                        onTypingStop?.();
                        onSend();
                    }}
                    aria-label="Send message"
                    disabled={disabled || isSending || (!value.trim() && selectedFiles.length === 0)}
                    className="p-2.5 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:opacity-40 disabled:cursor-not-allowed text-white"
                    style={{ 
                        backgroundColor: (value.trim() || selectedFiles.length > 0) ? 'var(--workspace-primary)' : 'rgba(255,255,255,0.03)', 
                    }}
                >
                    {isSending ? (
                        <div className="h-5 w-5 border-2 border-t-transparent rounded-full animate-spin border-white" />
                    ) : (
                        <Send className="h-5 w-5" />
                    )}
                </button>
            </div>
        </div>
    );
};
