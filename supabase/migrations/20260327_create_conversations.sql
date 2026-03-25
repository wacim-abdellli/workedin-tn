-- Create conversations table to group messages between two users
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    participant_1 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    participant_2 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contract_id UUID REFERENCES contracts(id) ON DELETE SET NULL,
    last_message_text TEXT,
    last_message_at TIMESTAMPTZ,
    unread_count_1 INT DEFAULT 0,
    unread_count_2 INT DEFAULT 0,
    -- Ensure participant_1 < participant_2 to avoid duplicates
    CONSTRAINT conversations_participants_order CHECK (participant_1 < participant_2),
    -- Unique constraint on participants
    UNIQUE(participant_1, participant_2)
);

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "conversations_select" ON conversations
    FOR SELECT 
    USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "conversations_insert" ON conversations
    FOR INSERT 
    WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "conversations_update" ON conversations
    FOR UPDATE 
    USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- Indexes for fast lookup
CREATE INDEX idx_conversations_participant_1 ON conversations(participant_1);
CREATE INDEX idx_conversations_participant_2 ON conversations(participant_2);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC NULLS LAST);
CREATE INDEX idx_conversations_contract ON conversations(contract_id) WHERE contract_id IS NOT NULL;

-- Add conversation_id to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;

-- Index for messages by conversation
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);

-- Function to get or create conversation between two users
CREATE OR REPLACE FUNCTION get_or_create_conversation(
    user1 UUID,
    user2 UUID,
    p_contract_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_conversation_id UUID;
    v_participant_1 UUID;
    v_participant_2 UUID;
BEGIN
    -- Ensure participant_1 < participant_2 for consistency
    IF user1 < user2 THEN
        v_participant_1 := user1;
        v_participant_2 := user2;
    ELSE
        v_participant_1 := user2;
        v_participant_2 := user1;
    END IF;

    -- Try to find existing conversation
    SELECT id INTO v_conversation_id
    FROM conversations
    WHERE participant_1 = v_participant_1 
      AND participant_2 = v_participant_2
    LIMIT 1;

    -- If not found, create new conversation
    IF v_conversation_id IS NULL THEN
        INSERT INTO conversations (participant_1, participant_2, contract_id)
        VALUES (v_participant_1, v_participant_2, p_contract_id)
        RETURNING id INTO v_conversation_id;
    END IF;

    RETURN v_conversation_id;
END;
$$;

-- Function to update conversation metadata when a message is sent
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_conversation_id UUID;
BEGIN
    -- Get or create conversation
    IF NEW.conversation_id IS NULL THEN
        v_conversation_id := get_or_create_conversation(
            NEW.sender_id,
            NEW.receiver_id,
            NEW.contract_id
        );
        NEW.conversation_id := v_conversation_id;
    ELSE
        v_conversation_id := NEW.conversation_id;
    END IF;

    -- Update conversation metadata
    UPDATE conversations
    SET 
        last_message_text = NEW.content,
        last_message_at = NEW.created_at,
        updated_at = now(),
        -- Increment unread count for receiver
        unread_count_1 = CASE 
            WHEN participant_1 = NEW.receiver_id THEN unread_count_1 + 1 
            ELSE unread_count_1 
        END,
        unread_count_2 = CASE 
            WHEN participant_2 = NEW.receiver_id THEN unread_count_2 + 1 
            ELSE unread_count_2 
        END
    WHERE id = v_conversation_id;

    RETURN NEW;
END;
$$;

-- Trigger to update conversation on new message
DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON messages;
CREATE TRIGGER trigger_update_conversation_on_message
    BEFORE INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_on_message();

-- Function to mark conversation as read
CREATE OR REPLACE FUNCTION mark_conversation_read(
    p_conversation_id UUID,
    p_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE conversations
    SET 
        unread_count_1 = CASE WHEN participant_1 = p_user_id THEN 0 ELSE unread_count_1 END,
        unread_count_2 = CASE WHEN participant_2 = p_user_id THEN 0 ELSE unread_count_2 END
    WHERE id = p_conversation_id
      AND (participant_1 = p_user_id OR participant_2 = p_user_id);

    -- Also mark all messages in this conversation as read
    UPDATE messages
    SET is_read = true
    WHERE conversation_id = p_conversation_id
      AND receiver_id = p_user_id
      AND is_read = false;
END;
$$;

-- Backfill existing messages with conversation_id
DO $$
DECLARE
    msg RECORD;
    v_conversation_id UUID;
BEGIN
    FOR msg IN 
        SELECT DISTINCT sender_id, receiver_id, contract_id
        FROM messages
        WHERE conversation_id IS NULL
    LOOP
        v_conversation_id := get_or_create_conversation(
            msg.sender_id,
            msg.receiver_id,
            msg.contract_id
        );
        
        UPDATE messages
        SET conversation_id = v_conversation_id
        WHERE sender_id = msg.sender_id 
          AND receiver_id = msg.receiver_id
          AND (contract_id = msg.contract_id OR (contract_id IS NULL AND msg.contract_id IS NULL))
          AND conversation_id IS NULL;
    END LOOP;
END;
$$;

-- Update conversation metadata from existing messages
UPDATE conversations c
SET 
    last_message_text = (
        SELECT content 
        FROM messages 
        WHERE conversation_id = c.id 
        ORDER BY created_at DESC 
        LIMIT 1
    ),
    last_message_at = (
        SELECT created_at 
        FROM messages 
        WHERE conversation_id = c.id 
        ORDER BY created_at DESC 
        LIMIT 1
    ),
    unread_count_1 = (
        SELECT COUNT(*) 
        FROM messages 
        WHERE conversation_id = c.id 
          AND receiver_id = c.participant_1 
          AND is_read = false
    ),
    unread_count_2 = (
        SELECT COUNT(*) 
        FROM messages 
        WHERE conversation_id = c.id 
          AND receiver_id = c.participant_2 
          AND is_read = false
    );
