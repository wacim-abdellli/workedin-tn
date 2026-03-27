import type { User } from '@supabase/supabase-js';

import type { Profile } from '@/types';

const ADMIN_EMAILS = new Set(
  String(import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
);

function isAdminFromMetadata(user: User | null): boolean {
  if (!user) return false;

  const appMeta = user.app_metadata as Record<string, unknown> | undefined;
  const userMeta = user.user_metadata as Record<string, unknown> | undefined;

  return (
    appMeta?.is_admin === true ||
    userMeta?.is_admin === true ||
    appMeta?.role === 'admin' ||
    userMeta?.role === 'admin'
  );
}

function isAdminByEmail(user: User | null): boolean {
  if (!user?.email) return false;
  if (ADMIN_EMAILS.size === 0) return false;

  return ADMIN_EMAILS.has(user.email.trim().toLowerCase());
}

export function hasAdminAccess(user: User | null, profile: Profile | null): boolean {
  return profile?.is_admin === true || isAdminFromMetadata(user) || isAdminByEmail(user);
}
