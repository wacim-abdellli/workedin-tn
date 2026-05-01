/**
 * usePresence — Global real-time presence system
 *
 * Two responsibilities:
 *   1. Broadcasts this user to a global Supabase Realtime channel so others
 *      can see them as online.
 *   2. Exposes a Set<string> of currently online user IDs that any component
 *      can subscribe to via the hook.
 *
 * The broadcast only happens when `is_online_for_messages` is TRUE in the
 * user's profile. Toggling the preference off causes an immediate untrack.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

const CHANNEL_NAME = 'global-presence';
const HEARTBEAT_INTERVAL_MS = 30_000; // re-track every 30s to handle network drops

/** Singleton channel & subscriber count so all hook instances share one socket */
let _channel: RealtimeChannel | null = null;
let _subscriberCount = 0;
let _onlineIds: Set<string> = new Set();
const _listeners = new Set<(ids: Set<string>) => void>();

function notifyListeners() {
  const snapshot = new Set(_onlineIds);
  _listeners.forEach((cb) => cb(snapshot));
}

function getOrCreateChannel(): RealtimeChannel {
  if (_channel) return _channel;

  _channel = supabase.channel(CHANNEL_NAME, {
    config: { presence: { key: 'presence' } },
  });

  _channel
    .on('presence', { event: 'sync' }, () => {
      const state = _channel!.presenceState<{ user_id: string }>();
      const ids = new Set<string>();
      Object.values(state).forEach((presences) => {
        presences.forEach((p) => {
          if (p.user_id) ids.add(p.user_id);
        });
      });
      _onlineIds = ids;
      notifyListeners();
    })
    .subscribe();

  return _channel;
}

function destroyChannel() {
  if (_channel) {
    supabase.removeChannel(_channel);
    _channel = null;
    _onlineIds = new Set();
    notifyListeners();
  }
}

// ─── Public hook ──────────────────────────────────────────────────────────────

interface UsePresenceOptions {
  /** The current user's ID. Pass null/undefined when not authenticated. */
  userId: string | null | undefined;
  /** Whether the user has enabled "Online for messages". */
  isOnlineForMessages: boolean;
}

export function usePresence({ userId, isOnlineForMessages }: UsePresenceOptions) {
  const [onlineIds, setOnlineIds] = useState<Set<string>>(() => new Set(_onlineIds));
  const isTrackedRef = useRef(false);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Subscribe to shared state updates
  useEffect(() => {
    _subscriberCount += 1;
    const listener = (ids: Set<string>) => setOnlineIds(new Set(ids));
    _listeners.add(listener);

    // Ensure channel exists
    getOrCreateChannel();

    return () => {
      _listeners.delete(listener);
      _subscriberCount -= 1;
      if (_subscriberCount <= 0) {
        destroyChannel();
        _subscriberCount = 0;
      }
    };
  }, []);

  // Track/untrack this user based on preference and authentication state
  const track = useCallback(async () => {
    if (!userId || !_channel) return;
    try {
      await _channel.track({ user_id: userId });
      isTrackedRef.current = true;
    } catch {
      // Silently ignore — next heartbeat will retry
    }
  }, [userId]);

  const untrack = useCallback(async () => {
    if (!_channel || !isTrackedRef.current) return;
    try {
      await _channel.untrack();
    } catch {
      // Ignore
    }
    isTrackedRef.current = false;
  }, []);

  useEffect(() => {
    if (userId && isOnlineForMessages) {
      void track();
      heartbeatRef.current = setInterval(() => void track(), HEARTBEAT_INTERVAL_MS);
    } else {
      void untrack();
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    }

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
    };
  }, [userId, isOnlineForMessages, track, untrack]);

  // Untrack on page unload so presence drops immediately
  useEffect(() => {
    const handleUnload = () => { void untrack(); };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [untrack]);

  const isOnline = useCallback(
    (id: string | null | undefined) => Boolean(id && onlineIds.has(id)),
    [onlineIds],
  );

  return { onlineIds, isOnline };
}
