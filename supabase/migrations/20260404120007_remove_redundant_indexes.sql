-- Remove redundant indexes that are covered by better composite indexes
-- These old single-column indexes are less efficient and waste storage space

-- Drop old single-column participant indexes (covered by idx_conversations_participant1_activity and idx_conversations_participant2_activity)
DROP INDEX IF EXISTS idx_conversations_participant_1;
DROP INDEX IF EXISTS idx_conversations_participant_2;

-- Drop old generic last_message index (covered by activity indexes above)
DROP INDEX IF EXISTS idx_conversations_last_message;

-- Drop redundant composite index (covered by individual activity indexes which are more efficient for queries)
DROP INDEX IF EXISTS idx_conversations_participants;
