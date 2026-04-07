import type { User } from '@supabase/supabase-js';

import type { Profile } from '@/types';

const ADMIN_EMAILS = new Set(
  String(import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
);

/**
 * Checks only server-controlled signals:
 *   1. profile.is_admin   — written to DB by server/admin only (guarded
 *      by the trg_guard_profile_admin_fields trigger).
 *   2. app_metadata       — writable only by the Supabase service role,
 *      never by the client JS SDK.
 *   3. VITE_ADMIN_EMAILS  — compile-time env var, operator-controlled.
 *
 * user_metadata is intentionally excluded: it is writable by any
 * authenticated user via supabase.auth.updateUser() and was the
 * RISK-4 attack vector identified in the Phase 1 audit.
 */
function isAdminFromMetadata(user: User | null): boolean {
  if (!user) return false;

  const appMeta = user.app_metadata as Record<string, unknown> | undefined;

  // Only trust app_metadata (server-side only, not user-writable).
  return appMeta?.is_admin === true || appMeta?.role === 'admin';
}

function isAdminByEmail(user: User | null): boolean {
  if (!user?.email) return false;
  if (ADMIN_EMAILS.size === 0) return false;

  return ADMIN_EMAILS.has(user.email.trim().toLowerCase());
}

export function hasAdminAccess(user: User | null, profile: Profile | null): boolean {
  return profile?.is_admin === true || isAdminFromMetadata(user) || isAdminByEmail(user);
}
