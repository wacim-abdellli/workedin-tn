import { supabase } from './supabase';

export async function checkDatabase(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    return !error;
  } catch {
    return false;
  }
}

export async function checkCache(): Promise<boolean> {
  // If using Redis/caching layer, check it here
  // For now, return true if no cache layer
  return true;
}

export async function checkStorage(): Promise<boolean> {
  try {
    // Try to list files in storage bucket
    const { error } = await supabase.storage
      .from('profiles')
      .list('', { limit: 1 });
    return !error;
  } catch {
    return false;
  }
}

export async function getHealthStatus() {
  const dbHealthy = await checkDatabase();
  const cacheHealthy = await checkCache();
  const storageHealthy = await checkStorage();

  return {
    status: (dbHealthy && cacheHealthy && storageHealthy) ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks: {
      database: dbHealthy,
      cache: cacheHealthy,
      storage: storageHealthy,
    },
  };
}