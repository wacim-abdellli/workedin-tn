# Khedma-TN Monitoring Dashboard Setup Guide

**Last Updated:** March 31, 2026  
**Status:** Configuration Template Ready  
**Estimated Setup Time:** 2-4 hours  

---

## 🎯 Overview

This guide helps set up comprehensive monitoring for the Khedma-TN platform across staging and production environments.

---

## 📊 Monitoring Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Application Layer Monitoring                           │
│  ├─ Error Tracking (Sentry)                            │
│  ├─ Performance Monitoring (DataDog / New Relic)       │
│  └─ User Analytics (Google Analytics / Mixpanel)       │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│  Infrastructure Monitoring                              │
│  ├─ Server Health (Prometheus / Node Exporter)         │
│  ├─ Database Monitoring (Supabase Dashboard)           │
│  └─ Uptime Monitoring (UptimeRobot / Pingdom)          │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│  Alerting & Notifications                               │
│  ├─ PagerDuty (incident response)                      │
│  ├─ Slack (team notifications)                         │
│  └─ Email (critical alerts)                            │
└─────────────────────────────────────────────────────────┘
```

---

## 🔴 Critical Metrics to Monitor

### Application Level

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Error Rate | < 0.5% | > 2% | > 5% |
| Response Time (P95) | < 500ms | > 1s | > 3s |
| Response Time (P99) | < 1s | > 2s | > 5s |
| 5xx Error Rate | 0% | > 1% | > 5% |
| Request Rate | > 100 req/s | < 50 | < 10 |

### Infrastructure Level

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| CPU Usage | < 60% | > 75% | > 90% |
| Memory Usage | < 70% | > 80% | > 95% |
| Disk Space | > 20% free | < 15% | < 5% |
| Database Connections | < 50% of max | > 70% | > 90% |
| Database Query Time | < 100ms | > 200ms | > 500ms |

### Business Level

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| User Signups | > 10/day | < 5 | < 1 |
| Active Users | > 100 | < 50 | < 10 |
| Successful Payments | > 95% | < 90% | < 80% |
| Message Delivery | 100% | < 99% | < 95% |
| Proposal Submissions | > 50/day | < 25 | < 10 |

---

## 1️⃣ Error Tracking Setup (Sentry)

### Installation

```bash
npm install @sentry/react @sentry/tracing
```

### Configuration

Create `src/lib/sentry.ts`:

```typescript
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export function initSentry() {
  Sentry.init({
    dsn: process.env.VITE_SENTRY_DSN,
    environment: process.env.VITE_SENTRY_ENVIRONMENT || 'staging',
    integrations: [
      new BrowserTracing({
        tracingOrigins: ['localhost', /^\//],
      }),
    ],
    tracesSampleRate: process.env.VITE_APP_ENV === 'production' ? 0.1 : 1.0,
    beforeSend: (event, hint) => {
      // Filter out non-production errors in staging
      if (
        process.env.VITE_APP_ENV === 'staging' &&
        event.level === 'debug'
      ) {
        return null;
      }
      return event;
    },
  });
}
```

### Setup in main.tsx

```typescript
import { initSentry } from './lib/sentry';

initSentry();

// Rest of your app...
```

### Alert Rules

Configure in Sentry Dashboard:

```
Rule 1: High Error Rate
- Condition: Error rate > 5%
- Frequency: Hourly
- Notify: #dev-alerts Slack channel
- Action: Create PagerDuty incident

Rule 2: Critical Errors
- Condition: Level = ERROR or FATAL
- Frequency: Immediately
- Notify: Team Lead + #dev-alerts
- Action: Page on-call engineer

Rule 3: Performance Degradation
- Condition: Response time P95 > 2s
- Frequency: Hourly
- Notify: #dev-alerts Slack channel
```

---

## 2️⃣ Performance Monitoring (DataDog)

### Installation

```bash
npm install @datadog/browser-rum
```

### Configuration

Create `src/lib/datadog.ts`:

```typescript
import { datadogRum } from '@datadog/browser-rum';

export function initDatadog() {
  datadogRum.init({
    applicationId: process.env.VITE_DATADOG_APP_ID,
    clientToken: process.env.VITE_DATADOG_CLIENT_TOKEN,
    site: 'datadoghq.com',
    service: 'khedma-tn',
    env: process.env.VITE_APP_ENV || 'staging',
    version: process.env.VITE_APP_VERSION,
    sessionSampleRate: 100,
    sessionReplaySampleRate: process.env.VITE_APP_ENV === 'production' ? 10 : 100,
    trackUserInteractions: true,
    trackResources: true,
    trackLongTasks: true,
    defaultPrivacyLevel: 'mask-user-input',
  });

  datadogRum.startSessionReplayRecording();
}
```

### Dashboard Queries

Create in DataDog:

```javascript
// Page Load Performance
avg:frontend.performance.page_load{service:khedma-tn}

// Error Rate
avg:trace.web.request.errors{service:khedma-tn} / avg:trace.web.request.count{service:khedma-tn}

// Real-Time Active Users
count:rum.sessions{service:khedma-tn,status:active}

// API Response Time
p95:trace.web.request.duration{service:khedma-tn}
```

---

## 3️⃣ Infrastructure Monitoring (Prometheus/Node Exporter)

### Setup on VPS

```bash
# Install Prometheus
wget https://github.com/prometheus/prometheus/releases/download/latest/prometheus-linux-amd64.tar.gz
tar xvfz prometheus-linux-amd64.tar.gz
sudo mv prometheus /opt/

# Install Node Exporter
wget https://github.com/prometheus/node_exporter/releases/download/latest/node_exporter-linux-amd64.tar.gz
tar xvfz node_exporter-linux-amd64.tar.gz
sudo mv node_exporter /opt/
```

### Prometheus Configuration

Create `/opt/prometheus/prometheus.yml`:

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - 'localhost:9093'

rule_files:
  - 'alert_rules.yml'

scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']

  - job_name: 'khedma-app'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['localhost:3000']
```

### Alert Rules

Create `/opt/prometheus/alert_rules.yml`:

```yaml
groups:
  - name: khedma_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"

      - alert: HighCPUUsage
        expr: node_cpu_seconds_total{mode="idle"} < 0.4
        for: 10m
        annotations:
          summary: "High CPU usage"

      - alert: HighMemoryUsage
        expr: node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes < 0.2
        for: 10m
        annotations:
          summary: "Low available memory"

      - alert: LowDiskSpace
        expr: node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"} < 0.1
        for: 10m
        annotations:
          summary: "Low disk space"
```

---

## 4️⃣ Supabase Database Monitoring

### Built-in Monitoring

Supabase provides:

```
Dashboard → Monitoring → Queries
  └─ Query performance
  └─ Slow queries (> 1s)
  └─ Query count trends

Dashboard → Monitoring → Database Health
  └─ Connection pool status
  └─ Cache hit ratio
  └─ Table sizes
```

### Query Performance Monitoring

```sql
-- Most expensive queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE mean_time > 100
ORDER BY total_time DESC
LIMIT 10;

-- Slow queries
SELECT 
  query_time,
  query
FROM pg_stat_statements_log
WHERE query_time > 1000
ORDER BY query_time DESC
LIMIT 20;
```

### RLS Policy Performance

Monitor RLS policies don't cause N+1 queries:

```sql
-- Check for queries with high call count
SELECT query, calls FROM pg_stat_statements
WHERE query LIKE '%profiles%'
ORDER BY calls DESC;
```

---

## 5️⃣ Uptime Monitoring (UptimeRobot)

### Setup Checks

Configure UptimeRobot:

1. **Homepage Check**
   - URL: `https://khedma.tn/`
   - Interval: Every 5 minutes
   - Timeout: 30 seconds
   - Alert on down: Yes

2. **API Health Check**
   - URL: `https://khedma.tn/api/health`
   - Interval: Every 5 minutes
   - Expected status: 200
   - Alert on error: Yes

3. **Chat Realtime Check**
   - URL: `https://khedma.tn/workspace/test`
   - Interval: Every 10 minutes
   - Check for: WebSocket connection success
   - Alert on error: Yes

4. **Payment Gateway Check**
   - URL: `https://api.flouci.com/status`
   - Interval: Every 15 minutes
   - Expected status: 200
   - Alert on error: Yes

### Alert Configuration

```
Alert Type: Slack Notification
Channel: #prod-alerts
Message Template:
  "🔴 [SERVICE] Down!
   URL: [url]
   Status: [status_code]
   Response Time: [response_time]
   Affected: [affected_users_estimate]"
```

---

## 📊 Sample Dashboards

### Dashboard 1: Real-Time Health

```
┌─────────────────────────────────────────────────┐
│ KHEDMA-TN PRODUCTION - REAL-TIME HEALTH         │
├─────────────────────────────────────────────────┤
│                                                 │
│ 🟢 Uptime: 99.98%        🟢 Error Rate: 0.1%   │
│ 🟢 Response Time: 234ms  🟢 Active Users: 1,245│
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Request Rate (req/s)                        │ │
│ │      │                                       │ │
│ │  500 ├───┐                                   │ │
│ │  400 │   └─┐                                 │ │
│ │  300 │     └────────────                    │ │
│ │  200 │                  └─────               │ │
│ │  100 │                                       │ │
│ │    0 └──────────────────────────             │ │
│ │     Now   -5m   -10m   -15m   -20m           │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ Error Rate (%)                              │ │
│ │   2% ├─────────────                         │ │
│ │   1% │         ┌─┐                           │ │
│ │   0% │─────────┘ └─────────────              │ │
│ │      Now   -5m   -10m   -15m   -20m          │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Dashboard 2: Business Metrics

```
Key Metrics (24h):
├─ New Users: 156 ✅
├─ Jobs Posted: 42 ✅
├─ Proposals: 238 ✅
├─ Contracts Started: 18 ✅
├─ Payments Processed: $12,450 ✅
└─ Revenue Generated: $2,490 ✅
```

### Dashboard 3: Performance Breakdown

```
API Endpoints (P95 Response Time):
├─ /api/jobs: 145ms ✅
├─ /api/proposals: 267ms ⚠️ (trend: ↑)
├─ /api/messages: 89ms ✅
├─ /api/contracts: 512ms ⚠️ (needs optimization)
└─ /api/payments: 1,234ms ❌ (Flouci API)
```

---

## 🔔 Alert Examples

### Critical Alert

```
🔴 CRITICAL ALERT
Service: khedma-tn-api
Issue: Error rate 15% (threshold: 5%)
Duration: 8 minutes
Affected Users: ~340
Last Error: "Database connection timeout"
Action: Auto-scaling triggered, check Kubernetes
Escalate: tech-lead@khedma.tn
```

### Warning Alert

```
⚠️ WARNING
Service: khedma-tn-api
Issue: Response time P95 = 1.2s (threshold: 0.5s)
Trend: Increasing (last hour avg: 0.8s)
Possible Cause: High database query load
Recommendation: Review slow query log
```

---

## 📋 Monitoring Checklist

- [ ] Sentry configured and receiving errors
- [ ] DataDog RUM tracking user sessions
- [ ] Prometheus scraping metrics
- [ ] Grafana dashboards created
- [ ] UptimeRobot checks configured
- [ ] Alert rules defined
- [ ] Slack integration working
- [ ] PagerDuty configured for critical alerts
- [ ] Team trained on monitoring tools
- [ ] Runbook updated with escalation paths
- [ ] On-call rotation configured
- [ ] Weekly review of metrics scheduled

---

## 🎯 Success Criteria

Monitoring setup is complete when:

✅ Errors appear in Sentry within 30 seconds  
✅ Performance metrics visible in DataDog  
✅ Infrastructure metrics in Prometheus  
✅ Alerts trigger correctly in Slack  
✅ Critical incidents escalate to PagerDuty  
✅ Team can access all dashboards  
✅ On-call engineer can respond to alerts  

---

## 📚 References

- Sentry Docs: https://docs.sentry.io/
- DataDog Docs: https://docs.datadoghq.com/
- Prometheus Docs: https://prometheus.io/docs/
- Supabase Docs: https://supabase.com/docs

---

**Setup by:** [Name]  
**Reviewed by:** [Name]  
**Last Updated:** March 31, 2026  
**Next Review:** April 30, 2026
