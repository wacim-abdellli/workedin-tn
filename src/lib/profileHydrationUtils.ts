export const PROFILES_UPDATE_MAX_RETRIES = 6;

export function getErrorMessageText(error: unknown): string {
  if (error instanceof Error) {
    return error.message || '';
  }

  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }

  return String(error || '');
}

export function extractMissingProfilesColumn(error: unknown): string | null {
  const message = getErrorMessageText(error).toLowerCase();
  if (!message || !message.includes('profiles')) {
    return null;
  }

  // PostgREST schema-cache error format.
  const schemaCacheMatch = message.match(/could not find the ['"]?([a-z0-9_]+)['"]? column of ['"]?profiles['"]?/i);
  if (schemaCacheMatch?.[1]) {
    return schemaCacheMatch[1];
  }

  // Postgres relation error format.
  const relationMatch = message.match(/column ['"]?([a-z0-9_]+)['"]? of relation ['"]?profiles['"]? does not exist/i);
  if (relationMatch?.[1]) {
    return relationMatch[1];
  }

  return null;
}
