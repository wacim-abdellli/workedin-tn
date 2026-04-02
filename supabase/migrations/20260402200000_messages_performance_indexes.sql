-- Performance optimization indexes for messaging system
-- Run this migration to improve query performance

-- Index for messages by conversation (most common query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_created 
ON messages(conversation_id, created_at DESC);

-- Index for conversations by participant with activity order
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_participant1_activity 
ON conversations(participant_1, last_message_at DESC NULLS LAST) 
WHERE participant_1 IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_participant2_activity 
ON conversations(participant_2, last_message_at DESC NULLS LAST) 
WHERE participant_2 IS NOT NULL;

-- Index for unread message counts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_unread_counts 
ON conversations(participant_1, participant_2, unread_count_1, unread_count_2);

-- Index for message read status
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_read_status 
ON messages(receiver_id, is_read, created_at DESC) 
WHERE is_read = false;

-- Index for notifications (mobile nav)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_read 
ON notifications(user_id, is_read, created_at DESC) 
WHERE is_read = false;

-- Composite index for conversation participant queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_participants 
ON conversations USING btree (participant_1, participant_2);

-- Index for message attachments query
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_attachments 
ON messages USING gin (attachments) 
WHERE attachments IS NOT NULL AND attachments != '[]';