// Re-export all types
export type { ConversationScope, ConversationQueryOptions, Conversation, Message, ConversationParticipantRow, ConversationRow } from './types';

// Re-export utils (some are used internally, some by consumers)
export { normalizeMessageError, isMissingSchemaColumn, extractConversationIdFromRpcPayload, buildMessageAttachmentPath, getConversationCacheKey } from './utils';

// Re-export conversations
export { getOrCreateConversationId, getConversations, getTotalUnreadCount, conversationIdCache } from './conversations';

// Re-export operations
export { getMessages, uploadMessageAttachment, sendMessage, markConversationRead, deleteMessage } from './operations';

// Re-export subscriptions
export { subscribeToConversation, subscribeToIncomingMessages, subscribeToConversations, unsubscribeFromChannel } from './subscriptions';

// Re-export legacy
export { markMessageRead, subscribeToMessages, sendContractMessage } from './legacy';
