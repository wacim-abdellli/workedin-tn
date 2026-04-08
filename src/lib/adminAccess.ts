import type { User } from '@supabase/supabase-js';

import type { Profile } from '@/types';

/**
 * Checks only server-controlled signals:
 *   1. profile.is_admin — written to DB by server/admin only.
 *   2. app_metadata — writable only by the Supabase service role.
 *
 * user_metadata is intentionally excluded because it is client-writable.
 * VITE_ADMIN_EMAILS has been removed to avoid bundle-visible operator hints
 * and redundant frontend-only admin paths.
 */
function isAdminFromMetadata(user: User | null): boolean {
  if (!user) return false;

  const appMeta = user.app_metadata as Record<string, unknown> | undefined;

  return appMeta?.is_admin === true || appMeta?.role === 'admin';
}

export function hasAdminAccess(user: User | null, profile: Profile | null): boolean {
  return profile?.is_admin === true || isAdminFromMetadata(user);
}
