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

export async function supabaseWithRetry<TResult extends SupabaseResultLike<unknown>>(
  queryFn: () => PromiseLike<TResult> | TResult
): Promise<TResult> {
  let result = await withTimeout(Promise.resolve(queryFn()), 8000, 'Supabase query');

  if (getResultStatus(result) === 401) {
    const { error: refreshError } = await withTimeout(
      supabase.auth.refreshSession(),
      5000,
      'Token refresh'
    );
    if (refreshError) throw refreshError;
    result = await withTimeout(Promise.resolve(queryFn()), 8000, 'Supabase query retry');
  }

  if (result.error) {
    throw normalizeSupabaseError(result.error);
  }

  return result;
}
