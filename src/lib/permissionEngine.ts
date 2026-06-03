import { logger } from '@/lib/logger';
import type { Workspace } from '@/lib/workspaceState';
import { getWorkspaceCapabilities, getInitialWorkspace } from '@/lib/workspaceRoutes';
import { supabase } from '@/lib/supabase';

/**
 * Logs a security audit event to the database.
 */
async function logSecurityEvent(userId: string, action: string, details: any) {
  try {
    const { error } = await supabase.from('security_audit_logs').insert({
      user_id: userId,
      action,
      details,
    });
    if (error) {
      logger.error(`[PermissionEngine] Failed to write security audit log: ${error.message}`);
    }
  } catch (err) {
    logger.error('[PermissionEngine] Exception writing security audit log:', err);
  }
}

/**
 * Validates if a user has access to view or mutate a contract.
 * @param userId - The ID of the authenticated user
 * @param contract - The contract row from database
 */
export function canAccessContract(
  userId: string,
  contract: { client_id?: string | null; freelancer_id?: string | null } | null | undefined
): boolean {
  if (!contract) {
    logger.warn('[PermissionEngine] Access blocked: Contract is null or undefined.');
    return false;
  }

  const hasAccess = contract.client_id === userId || contract.freelancer_id === userId;
  if (!hasAccess) {
    logger.error(`[PermissionEngine] Access violation: User ${userId} is not a participant in contract client_id=${contract.client_id}, freelancer_id=${contract.freelancer_id}`);
    void logSecurityEvent(userId, 'contract_access_violation', {
      contract_id: (contract as any)?.id || null,
      client_id: contract.client_id,
      freelancer_id: contract.freelancer_id,
    });
  }

  return hasAccess;
}

/**
 * Validates if a user is the sender or receiver of a message.
 * @param userId - The ID of the authenticated user
 * @param message - The message row from database
 */
export function canAccessMessage(
  userId: string,
  message: { sender_id?: string | null; receiver_id?: string | null } | null | undefined
): boolean {
  if (!message) {
    logger.warn('[PermissionEngine] Access blocked: Message is null or undefined.');
    return false;
  }

  const hasAccess = message.sender_id === userId || message.receiver_id === userId;
  if (!hasAccess) {
    logger.error(`[PermissionEngine] Access violation: User ${userId} is not sender/receiver of message. message.sender_id=${message.sender_id}, message.receiver_id=${message.receiver_id}`);
    void logSecurityEvent(userId, 'message_access_violation', {
      message_id: (message as any)?.id || null,
      sender_id: message.sender_id,
      receiver_id: message.receiver_id,
    });
  }

  return hasAccess;
}

/**
 * Validates if a user is the sender of a message to allow deletion.
 * @param userId - The ID of the authenticated user
 * @param message - The message row from database
 */
export function canDeleteMessage(
  userId: string,
  message: { sender_id?: string | null } | null | undefined
): boolean {
  if (!message) {
    logger.warn('[PermissionEngine] Delete blocked: Message is null or undefined.');
    return false;
  }

  const isOwner = message.sender_id === userId;
  if (!isOwner) {
    logger.error(`[PermissionEngine] Delete violation: User ${userId} is not the sender of message (sender_id=${message.sender_id})`);
    void logSecurityEvent(userId, 'message_delete_violation', {
      message_id: (message as any)?.id || null,
      sender_id: message.sender_id,
    });
  }

  return isOwner;
}

/**
 * Validates if a user has access to send messages inside a conversation.
 * @param userId - The ID of the authenticated user
 * @param conversation - The conversation row from database
 */
export function canSendMessage(
  userId: string,
  conversation: { participant_1?: string | null; participant_2?: string | null } | null | undefined
): boolean {
  if (!conversation) {
    logger.warn('[PermissionEngine] Message block: Conversation is null or undefined.');
    return false;
  }

  const hasAccess = conversation.participant_1 === userId || conversation.participant_2 === userId;
  if (!hasAccess) {
    logger.error(`[PermissionEngine] Message violation: User ${userId} is not a participant in conversation participant_1=${conversation.participant_1}, participant_2=${conversation.participant_2}`);
    void logSecurityEvent(userId, 'message_send_violation', {
      conversation_id: (conversation as any)?.id || null,
      participant_1: conversation.participant_1,
      participant_2: conversation.participant_2,
    });
  }

  return hasAccess;
}

/**
 * Resolves the active workspace mode based on user profiles and requests, enforcing capability checks.
 * @param profile - The user's main profile
 * @param freelancerProfile - The user's freelancer profile (optional)
 * @param requestedWorkspace - The requested workspace context
 */
export function resolveWorkspace(
  profile: any,
  freelancerProfile?: any,
  requestedWorkspace?: Workspace | null
): Workspace {
  if (!profile) {
    logger.info('[PermissionEngine] Profile not loaded yet. Defaulting workspace context to requested or client.');
    return requestedWorkspace ?? 'client';
  }

  const capabilities = getWorkspaceCapabilities(profile.user_type);
  if (requestedWorkspace && capabilities.includes(requestedWorkspace)) {
    return requestedWorkspace;
  }

  if (requestedWorkspace) {
    logger.warn(`[PermissionEngine] Workspace spoofing detected: User ${profile.id} of type ${profile.user_type} requested unauthorized workspace: ${requestedWorkspace}`);
    void logSecurityEvent(profile.id, 'workspace_spoofing_attempt', {
      user_type: profile.user_type,
      requested_workspace: requestedWorkspace,
      capabilities,
    });
  }

  const initialWorkspace = getInitialWorkspace(profile, freelancerProfile);
  logger.info(`[PermissionEngine] Resolved active workspace context: initial=${initialWorkspace}, requested=${requestedWorkspace}, capabilities=${capabilities.join(',')}`);
  return initialWorkspace;
}

/**
 * Validates if a user's account is suspended or archived.
 * @param profile - The user profile row from database
 */
export function isSuspended(
  profile: { account_status?: string | null } | null | undefined
): boolean {
  return profile?.account_status === 'suspended' || profile?.account_status === 'archived';
}
