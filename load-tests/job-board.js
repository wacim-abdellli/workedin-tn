import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * k6 Load Test: Job Board Browsing
 *
 * Simulates 100 virtual users browsing the job board for 30s.
 * Target: Response time < 2s, zero 5xx errors.
 *
 * Usage:
 *   k6 run --env BASE_URL=https://khedma-tn-preview.vercel.app load-tests/job-board.js
 */

export const options = {
  vus: 100,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95th percentile < 2s
    http_req_failed: ['rate<0.01'],     // < 1% failure rate
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://khedma-tn.vercel.app';

export default function () {
  // 1. Load homepage
  const homeRes = http.get(`${BASE_URL}/`);
  check(homeRes, {
    'homepage status 200': (r) => r.status === 200,
    'homepage loads < 2s': (r) => r.timings.duration < 2000,
    'no 5xx errors': (r) => r.status < 500,
  });
  sleep(1);

  // 2. Browse job board
  const jobsRes = http.get(`${BASE_URL}/jobs`);
  check(jobsRes, {
    'job board status 200': (r) => r.status === 200,
    'job board loads < 2s': (r) => r.timings.duration < 2000,
    'no 5xx errors': (r) => r.status < 500,
  });
  sleep(1);

  // 3. Browse freelancers
  const freelancersRes = http.get(`${BASE_URL}/find-freelancers`);
  check(freelancersRes, {
    'freelancers page status 200': (r) => r.status === 200,
    'freelancers page loads < 2s': (r) => r.timings.duration < 2000,
    'no 5xx errors': (r) => r.status < 500,
  });
  sleep(1);
}
