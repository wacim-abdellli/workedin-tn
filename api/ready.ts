import { getHealthStatus } from '../src/lib/healthCheck.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const health = await getHealthStatus();
  const ready = health.status === 'ok';

  return res.status(ready ? 200 : 503).json({
    ready,
    timestamp: new Date().toISOString(),
  });
}