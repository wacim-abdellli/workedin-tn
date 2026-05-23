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
        <div className="flex flex-col gap-2 p-4 border-t" style={{ borderColor: 'var(--color-border-subtle)', backgroundColor: 'var(--color-bg-base)' }}>
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
                            <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-2 border" style={{ backgroundColor: 'var(--color-bg-muted)', borderColor: 'var(--color-border-subtle)' }}>
                                <FileText className="h-4 w-4" style={{ color: 'var(--color-text-tertiary)' }} />
                                <span className="text-xs max-w-[120px] truncate" style={{ color: 'var(--color-text-secondary)' }}>{file.name}</span>
                                <button 
                                    onClick={() => onRemoveFile(i)} 
                                    className="p-1 rounded-full hover:bg-black/10 transition-colors"
                                >
                                    <X className="h-3 w-3" style={{ color: 'var(--color-text-tertiary)' }} />
                                </button>
                            </div>
                        ))}
                    </m.div>
                )}
            </AnimatePresence>

            <div className="flex items-end gap-2 rounded-2xl border p-1 focus-within:ring-2 focus-within:ring-[var(--workspace-primary)]/40 transition-all" style={{ backgroundColor: 'var(--color-bg-subtle)', borderColor: 'var(--color-border-subtle)' }}>
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
                    disabled={disabled || isSending || isRecording}
                    className="p-2.5 rounded-xl transition-colors disabled:opacity-50"
                    style={{ color: 'var(--color-text-tertiary)' }}
                >
                    <Paperclip className="h-5 w-5 hover:text-[var(--color-text-primary)] transition-colors" />
                </button>

                {/* Audio Recording */}
                <button
                    onClick={onToggleRecord}
                    disabled={disabled || isSending}
                    className={`p-2.5 rounded-xl transition-all disabled:opacity-50 ${isRecording ? 'bg-red-500/20 text-red-400' : ''}`}
                    style={!isRecording ? { color: 'var(--color-text-tertiary)' } : {}}
                >
                    {isRecording ? <Square className="h-5 w-5 fill-current" /> : <Mic className="h-5 w-5 hover:text-[var(--color-text-primary)] transition-colors" />}
                </button>

                {/* Text Input */}
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onBlur={onTypingStop}
                    placeholder={isRecording ? 'Recording audio...' : placeholder}
                    disabled={disabled || isSending || isRecording}
                    rows={1}
                    className="flex-1 bg-transparent border-0 ring-0 focus:ring-0 focus:outline-none text-[14px] px-2 py-2.5 resize-none max-h-32 min-h-[44px] disabled:opacity-50"
                    style={{ color: 'var(--color-text-primary)' }}
                />

                {/* Send Button */}
                <button
                    onClick={() => {
                        onTypingStop?.();
                        onSend();
                    }}
                    disabled={disabled || isSending || (!value.trim() && selectedFiles.length === 0)}
                    className="p-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                        backgroundColor: (value.trim() || selectedFiles.length > 0) ? 'var(--color-brand-primary)' : 'var(--color-bg-muted)', 
                        color: (value.trim() || selectedFiles.length > 0) ? 'var(--color-text-inverse)' : 'var(--color-text-tertiary)' 
                    }}
                >
                    {isSending ? (
                        <div className="h-5 w-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--color-text-inverse)', borderTopColor: 'transparent' }} />
                    ) : (
                        <Send className="h-5 w-5" />
                    )}
                </button>
            </div>
        </div>
    );
};
