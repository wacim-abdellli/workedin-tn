import { supabase } from './supabase';

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime?: number;
  checks: {
    database: boolean;
    cache: boolean;
    storage: boolean;
  };
  version?: string;
}

const startTime = Date.now();

export async function checkDatabase(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('[Health] Database check failed:', error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[Health] Database check error:', error);
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
    
    if (error) {
      console.error('[Health] Storage check failed:', error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[Health] Storage check error:', error);
    return false;
  }
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const dbHealthy = await checkDatabase();
  const cacheHealthy = await checkCache();
  const storageHealthy = await checkStorage();

  const allHealthy = dbHealthy && cacheHealthy && storageHealthy;
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  return {
    status: allHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime,
    checks: {
      database: dbHealthy,
      cache: cacheHealthy,
      storage: storageHealthy,
    },
    version: '1.0.0',
  };
}

export async function getReadinessStatus(): Promise<{
  ready: boolean;
  timestamp: string;
}> {
  const health = await getHealthStatus();
  return {
    ready: health.status === 'ok',
    timestamp: health.timestamp,
  };
}

export async function getLivenessStatus(): Promise<{
  alive: boolean;
  timestamp: string;
}> {
  return {
    alive: true,
    timestamp: new Date().toISOString(),
  };
}