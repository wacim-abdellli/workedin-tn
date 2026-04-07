import { supabase, withTimeout } from '@/lib/supabase';
type SupabaseErrorLike = Error & {
  status?: number;
  code?: string;
  details?: string;
  hint?: string;
};
type SupabaseResultLike<TData = unknown> = {
  data?: TData;
  error: unknown;
  status?: number;
  count?: number | null;
};
function normalizeSupabaseError(error: unknown): SupabaseErrorLike {
  if (error instanceof Error) {
    return error as SupabaseErrorLike;
  }
  const errorRecord = typeof error === 'object' && error ? (error as Record<string, unknown>) : {};
  const normalized = new Error(
    typeof errorRecord.message === 'string' ? errorRecord.message : 'Supabase request failed'
  ) as SupabaseErrorLike;
  if (typeof errorRecord.status === 'number') normalized.status = errorRecord.status;
  if (typeof errorRecord.code === 'string') normalized.code = errorRecord.code; 
  if (typeof errorRecord.details === 'string') normalized.details = errorRecord.details;
  if (typeof errorRecord.hint === 'string') normalized.hint = errorRecord.hint; 

  return normalized;
}
function getErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const errorRecord = error as Record<string, unknown>;
  return typeof errorRecord.status === 'number' ? errorRecord.status : undefined;
}
function getResultStatus(result: SupabaseResultLike<unknown>): number | undefined {
  return getErrorStatus(result.error) ?? result.status;
}
// Promise singleton for token refreshes to prevent race conditions (Blocker #2)
let refreshPromise: Promise<{ data: any; error: any } | void> | null = null;
export async function supabaseWithRetry<TResult extends SupabaseResultLike<unknown>>(
  queryFn: () => PromiseLike<TResult> | TResult,
  options: { throwOnError?: boolean; timeoutMs?: number; refreshTimeoutMs?: number } = {}
): Promise<TResult> {
  const timeoutMs = options.timeoutMs ?? 15000;
  const refreshTimeoutMs = options.refreshTimeoutMs ?? 5000;
  let result = await withTimeout(Promise.resolve(queryFn()), timeoutMs, 'Supabase query');
  if (getResultStatus(result) === 401) {
    // If a refresh is not already in progress, start one and save the promise
    if (!refreshPromise) {
      refreshPromise = withTimeout(
        supabase.auth.refreshSession(),
        refreshTimeoutMs,
        'Token refresh'
      ).finally(() => {
        // Clear the singleton once complete (either success or failure)
        refreshPromise = null;
      });
    }

    // Wait for the singleton promise to finish, letting concurrent 401s latch on to the same request
    const refreshResult = await refreshPromise;

    if (refreshResult && refreshResult.error) throw refreshResult.error;

    // Retry original query now that token is refreshed
    result = await withTimeout(Promise.resolve(queryFn()), timeoutMs, 'Supabase query retry');
  }

  if (result.error) {
    if (options.throwOnError !== false) {
      throw normalizeSupabaseError(result.error);
    }
    return result;
  }

  return result;
}
