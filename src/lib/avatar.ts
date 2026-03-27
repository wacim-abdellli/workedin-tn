export function getAvatarGradient(name: string) {
  const colors: Array<[string, string]> = [
    ['#8b5cf6', '#6d28d9'],
    ['#f59e0b', '#d97706'],
    ['#10b981', '#059669'],
    ['#3b82f6', '#1d4ed8'],
    ['#ec4899', '#be185d'],
  ];

  const safeName = name.trim() || 'K';
  const index = safeName.charCodeAt(0) % colors.length;
  return colors[index];
}

export function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'K';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? '').join('');
}

/**
 * Account avatar source-of-truth: always use profiles.avatar_url.
 * Keeps identity consistent across client and freelancer workspaces.
 */
export function resolveAccountAvatarUrl(profileAvatarUrl?: string | null, avatarFailed: boolean = false) {
  if (avatarFailed) return null;
  return profileAvatarUrl || null;
}
