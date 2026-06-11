import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { m, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/i18n';

export interface ConversationPreview {
    id: string;
    participantName: string;
    participantAvatar?: string | null;
    lastMessage?: string | null;
    timestamp?: string | null;
    unreadCount: number;
    isActive: boolean;
}

interface ChatSidebarProps {
    conversations: ConversationPreview[];
    onSelectConversation: (id: string) => void;
    onNewChat?: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
    conversations,
    onSelectConversation,
    onNewChat
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const { tx } = useTranslation();

    const filteredConversations = conversations.filter(c => 
        c.participantName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (c.lastMessage && c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="flex h-full w-full flex-col border-e bg-[var(--color-bg-base)]" style={{ borderColor: 'var(--color-border-subtle)' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{tx('messages.title', undefined, 'Messages')}</h2>
                {onNewChat && (
                    <button 
                        onClick={onNewChat}
                        className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-black/5"
                        style={{ color: 'var(--color-brand-primary)' }}
                    >
                        <Plus className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="p-4">
                <div className="relative flex items-center w-full rounded-xl border bg-[var(--color-bg-subtle)] px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-[var(--workspace-primary)]/40" style={{ borderColor: 'var(--color-border-subtle)' }}>
                    <Search className="h-4 w-4 shrink-0" style={{ color: 'var(--color-text-tertiary)' }} />
                    <input 
                        type="text"
                        placeholder={tx('messages.searchPlaceholder', undefined, 'Search messages...')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="ms-2 flex-1 bg-transparent border-0 outline-none ring-0 text-sm placeholder:opacity-70"
                        style={{ color: 'var(--color-text-primary)' }}
                    />
                </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
                <AnimatePresence>
                    {filteredConversations.length === 0 ? (
                        <m.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            className="p-6 text-center text-sm" 
                            style={{ color: 'var(--color-text-tertiary)' }}
                        >
                            {tx('messages.noConversationsFound', undefined, 'No conversations found.')}
                        </m.div>
                    ) : (
                        filteredConversations.map((conv) => (
                            <m.button
                                key={conv.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onClick={() => onSelectConversation(conv.id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${conv.isActive ? 'bg-[var(--color-bg-muted)]' : 'hover:bg-black/5'}`}
                            >
                                {/* Avatar */}
                                <div className="relative shrink-0">
                                    {conv.participantAvatar ? (
                                        <img src={conv.participantAvatar} alt={conv.participantName} className="h-12 w-12 rounded-full object-cover border" style={{ borderColor: 'var(--color-border-subtle)' }} />
                                    ) : (
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-[var(--color-bg-subtle)]" style={{ borderColor: 'var(--color-border-subtle)' }}>
                                            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                                                {conv.participantName.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                    {/* Online indicator could go here */}
                                </div>

                                {/* Details */}
                                <div className="flex flex-1 flex-col overflow-hidden">
                                    <div className="flex items-center justify-between">
                                        <h3 className="truncate font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
                                            {conv.participantName}
                                        </h3>
                                        {conv.timestamp && (
                                            <span className="shrink-0 text-[11px]" style={{ color: conv.unreadCount > 0 ? 'var(--color-brand-primary)' : 'var(--color-text-tertiary)' }}>
                                                {new Date(conv.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center justify-between gap-2 mt-0.5">
                                        <p className={`truncate text-[13px] ${conv.unreadCount > 0 ? 'font-medium' : ''}`} style={{ color: conv.unreadCount > 0 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                                            {conv.lastMessage || tx('messages.sentAttachment', undefined, 'Sent an attachment')}
                                        </p>
                                        
                                        {conv.unreadCount > 0 && (
                                            <div className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold shrink-0" style={{ backgroundColor: 'var(--color-brand-primary)', color: 'var(--color-text-inverse)' }}>
                                                {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </m.button>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
