import { describe, expect, it, vi, beforeEach } from 'vitest';

const { insertMock, fromMock } = vi.hoisted(() => {
  const insertMock = vi.fn().mockResolvedValue({ error: null });
  const fromMock = vi.fn().mockReturnValue({
    insert: insertMock,
  });
  return { insertMock, fromMock };
});

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: fromMock,
  },
}));

import {
  canAccessContract,
  canAccessMessage,
  canDeleteMessage,
  canSendMessage,
  resolveWorkspace,
  isSuspended,
} from '../permissionEngine';

describe('permissionEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('canAccessContract', () => {
    it('allows access for client', () => {
      const contract = { client_id: 'user-1', freelancer_id: 'user-2' };
      expect(canAccessContract('user-1', contract)).toBe(true);
      expect(fromMock).not.toHaveBeenCalled();
    });

    it('allows access for freelancer', () => {
      const contract = { client_id: 'user-1', freelancer_id: 'user-2' };
      expect(canAccessContract('user-2', contract)).toBe(true);
      expect(fromMock).not.toHaveBeenCalled();
    });

    it('blocks access for third party and logs event', () => {
      const contract = { id: 'contract-123', client_id: 'user-1', freelancer_id: 'user-2' };
      expect(canAccessContract('user-3', contract)).toBe(false);
      expect(fromMock).toHaveBeenCalledWith('security_audit_logs');
      expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 'user-3',
        action: 'contract_access_violation',
        details: expect.objectContaining({
          contract_id: 'contract-123',
        }),
      }));
    });
  });

  describe('canAccessMessage', () => {
    it('allows access for sender or receiver', () => {
      const message = { id: 'msg-1', sender_id: 'user-1', receiver_id: 'user-2' };
      expect(canAccessMessage('user-1', message)).toBe(true);
      expect(canAccessMessage('user-2', message)).toBe(true);
    });

    it('blocks access for third party and logs event', () => {
      const message = { id: 'msg-1', sender_id: 'user-1', receiver_id: 'user-2' };
      expect(canAccessMessage('user-3', message)).toBe(false);
      expect(fromMock).toHaveBeenCalledWith('security_audit_logs');
    });
  });

  describe('canDeleteMessage', () => {
    it('allows deletion for sender', () => {
      const message = { id: 'msg-1', sender_id: 'user-1' };
      expect(canDeleteMessage('user-1', message)).toBe(true);
    });

    it('blocks deletion for non-sender and logs event', () => {
      const message = { id: 'msg-1', sender_id: 'user-1' };
      expect(canDeleteMessage('user-2', message)).toBe(false);
      expect(fromMock).toHaveBeenCalledWith('security_audit_logs');
    });
  });

  describe('canSendMessage', () => {
    it('allows sending for conversation participants', () => {
      const conv = { id: 'conv-1', participant_1: 'user-1', participant_2: 'user-2' };
      expect(canSendMessage('user-1', conv)).toBe(true);
    });

    it('blocks sending for non-participants and logs event', () => {
      const conv = { id: 'conv-1', participant_1: 'user-1', participant_2: 'user-2' };
      expect(canSendMessage('user-3', conv)).toBe(false);
      expect(fromMock).toHaveBeenCalledWith('security_audit_logs');
    });
  });

  describe('resolveWorkspace', () => {
    it('resolves correct workspace if user has capability', () => {
      const profile = { id: 'user-1', user_type: 'both' };
      const resolved = resolveWorkspace(profile, null, 'freelancer');
      expect(resolved).toBe('freelancer');
      expect(fromMock).not.toHaveBeenCalled();
    });

    it('logs spoofing attempt when requesting workspace without capability', () => {
      const profile = { id: 'user-1', user_type: 'client' };
      const resolved = resolveWorkspace(profile, null, 'freelancer');
      expect(resolved).not.toBe('freelancer');
      expect(fromMock).toHaveBeenCalledWith('security_audit_logs');
      expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 'user-1',
        action: 'workspace_spoofing_attempt',
      }));
    });
  });

  describe('isSuspended', () => {
    it('detects suspended and archived status', () => {
      expect(isSuspended({ account_status: 'suspended' })).toBe(true);
      expect(isSuspended({ account_status: 'archived' })).toBe(true);
      expect(isSuspended({ account_status: 'active' })).toBe(false);
    });
  });
});
