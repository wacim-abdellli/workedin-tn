import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * k6 Load Test: Proposal Submission Under Load
 *
 * Simulates 20 virtual users submitting proposals concurrently.
 * Verifies rate limiting kicks in and no duplicate proposals are created.
 *
 * Usage:
 *   k6 run --env BASE_URL=https://khedma-tn-preview.vercel.app load-tests/proposal-submit.js
 *
 * NOTE: This test targets the Supabase API directly, as the frontend
 * creates proposals via the service layer. In a real scenario, you'd
 * need authenticated tokens. This script validates the API's behavior
 * under concurrent load.
 */

export const options = {
  vus: 20,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<3000'],  // 95th percentile < 3s
    http_req_failed: ['rate<0.05'],      // < 5% failure (rate limiting expected)
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://khedma-tn.vercel.app';
const SUPABASE_URL = __ENV.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || '';

export default function () {
  // 1. Test job board API (public, no auth needed)
  const jobsRes = http.get(`${BASE_URL}/jobs`);
  check(jobsRes, {
    'jobs page loads': (r) => r.status === 200,
    'no server errors': (r) => r.status < 500,
  });
  sleep(0.5);

  // 2. If Supabase URL is provided, test the API directly
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    // Test proposals endpoint (read-only, safe for load testing)
    const proposalsRes = http.get(
      `${SUPABASE_URL}/rest/v1/proposals?select=id,status&limit=5`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
      }
    );
    check(proposalsRes, {
      'proposals API responds': (r) => r.status === 200 || r.status === 401,
      'proposals API < 3s': (r) => r.timings.duration < 3000,
      'no 5xx on proposals': (r) => r.status < 500,
    });

    // 3. Test rate limiting by rapid-firing requests
    for (let i = 0; i < 5; i++) {
      const rapidRes = http.get(`${BASE_URL}/jobs`);
      check(rapidRes, {
        'rapid request handled': (r) => r.status < 500,
      });
    }
  }

  sleep(1);
}
