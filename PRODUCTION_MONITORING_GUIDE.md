# 🚀 Production-Grade Monitoring & Logging Stack

**Status**: ✅ Chuẩn Production-Grade
**Last Updated**: December 7, 2025

---

## 📚 Mục lục

- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Components](#components)
- [Configuration](#configuration)
- [Integration Guide](#integration-guide)
- [Phỏng Vấn QA](#phỏng-vấn-qa)

---

## 🚀 Quick Start

### 1. Start Monitoring Stack

```bash
# Docker Compose - Full Stack
docker-compose up -d  # Main services (postgres, redis, kafka, apps)
docker-compose -f docker-compose.monitoring.yml up -d  # Monitoring stack

# Or all at once
docker-compose up -d && docker-compose -f docker-compose.monitoring.yml up -d
```

### 2. Access Dashboards

| Tool           | URL                    | Credentials        |
| -------------- | ---------------------- | ------------------ |
| **Grafana**    | http://localhost:3005  | admin / admin123!  |
| **Prometheus** | http://localhost:9090  | -                  |
| **Kibana**     | http://localhost:5601  | elastic / changeme |
| **Jaeger**     | http://localhost:16686 | -                  |
| **Sentry**     | http://localhost:9000  | Set on first login |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│           NestJS Microservices                      │
├──────────────┬──────────────┬──────────────────────┤
│ API Gateway  │ Auth Service │ Video Service ...    │
└──────────────┴──────────────┴──────────────────────┘
        │
        ├─→ [Winston Logger]         → [Elasticsearch]
        ├─→ [prom-client]            → [Prometheus]
        ├─→ [Sentry SDK]             → [Sentry]
        ├─→ [Structured Logs]        → [Loki]
        └─→ [OTEL Traces]            → [Jaeger]

        │
        ▼
┌─────────────────────────────────────────────────────┐
│           Unified Monitoring Platform               │
├──────────────┬──────────────┬──────────────────────┤
│ Grafana      │ Kibana       │ Jaeger UI            │
│ (Dashboard)  │ (Log Search) │ (Trace Analysis)     │
└──────────────┴──────────────┴──────────────────────┘
        │
        │ [Prometheus Recording Rules]
        │ [Alert Rules] → [Alertmanager]
        │
        ▼
┌─────────────────────────────────────────────────────┐
│           Alerting & Notifications                  │
├──────────────┬──────────────┬──────────────────────┤
│ Slack        │ PagerDuty    │ Email                │
│ (Teams)      │ (On-call)    │ (Reports)            │
└──────────────┴──────────────┴──────────────────────┘
```

---

## 📊 Components

### 1. **Prometheus** (Time-Series Database)

- ✅ Scrapes metrics từ `/metrics` endpoint
- ✅ 30 days retention (configurable)
- ✅ Advanced queries (PromQL)
- ✅ Recording rules (pre-computation)

```yaml
# Scrape Config
scrape_configs:
  - job_name: 'api-gateway'
    static_configs:
      - targets: ['api-gateway:3000']
    scrape_interval: 15s
```

### 2. **Elasticsearch + Kibana** (Log Storage & Search)

- ✅ Centralized log aggregation
- ✅ Full-text search
- ✅ Index management (time-based)
- ✅ Log analytics & visualization

**Data Flow**:

```
Winston Logger
    ↓
Logstash (Processing)
    ↓
Elasticsearch (Storage)
    ↓
Kibana (Search & Visualize)
```

### 3. **Loki** (Lightweight Log Aggregation)

- ✅ Label-based querying (không parse full text)
- ✅ Lower resource usage vs Elasticsearch
- ✅ Direct Grafana integration
- ✅ LogQL query language

**vs Elasticsearch**:

- Loki: Lightweight, label-based, low cost
- Elasticsearch: Full-text search, powerful analytics, higher resource

### 4. **Grafana** (Unified Dashboard)

- ✅ Datasource: Prometheus, Elasticsearch, Loki, Jaeger
- ✅ Recording rules visualization
- ✅ Alert management
- ✅ Multi-user support

### 5. **Jaeger** (Distributed Tracing)

- ✅ Trace microservice calls end-to-end
- ✅ Latency analysis
- ✅ Dependency mapping
- ✅ OTLP protocol support

### 6. **Sentry** (Error Tracking)

- ✅ Real-time error alerts
- ✅ Source maps integration
- ✅ Session replay
- ✅ Performance monitoring

### 7. **Exporters** (Infrastructure Metrics)

- ✅ PostgreSQL Exporter (9187)
- ✅ Redis Exporter (9121)
- ✅ Node Exporter (9100)

---

## ⚙️ Configuration

### Environment Variables

```env
# Logging
LOG_LEVEL=debug
ELASTICSEARCH_NODE=http://elasticsearch:9200

# Sentry
SENTRY_DSN=https://your-dsn@sentry.io/123456
SENTRY_ENVIRONMENT=production

# Alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

### Prometheus Recording Rules

Pre-compute expensive queries:

```yaml
# prometheus-recording-rules.yml
- record: http:error_ratio:5m
  expr: (rate(http_request_errors_total[5m]) / rate(http_requests_total[5m])) * 100
```

### Alert Rules

```yaml
- alert: HighErrorRate
  expr: http:error_ratio:5m > 5
  for: 5m
  annotations:
    summary: 'Error rate > 5%'
```

---

## 🔧 Integration Guide

### 1. NestJS Logger Setup

```typescript
import { LoggerModule, CustomLoggerService, MetricsService } from '@app/common/logging';

@Module({
  imports: [LoggerModule],
})
export class AppModule {}

@Controller('/api')
export class TestController {
  constructor(
    private logger: CustomLoggerService,
    private metrics: MetricsService,
  ) {}

  @Get('test')
  test() {
    this.logger.log('API called', { endpoint: '/api/test' });
    this.metrics.recordHttpRequest('GET', '/api/test', 200, 45);
    return { success: true };
  }
}
```

### 2. Error Tracking with Sentry

```typescript
import { SentryService } from '@app/common/logging';

@Injectable()
export class PaymentService {
  constructor(private sentry: SentryService) {}

  async process(amount: number) {
    const transaction = this.sentry.startTransaction('payment_process', 'http');
    try {
      await this.chargeCard(amount);
      transaction.setStatus('ok');
    } catch (error) {
      this.sentry.captureException(error, { amount });
      transaction.setStatus('error');
    } finally {
      transaction.finish();
    }
  }
}
```

### 3. Database Query Monitoring

```typescript
async getUser(userId: string) {
  const start = Date.now();
  try {
    const user = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    this.metrics.recordDatabaseQuery('SELECT', 'users', Date.now() - start);
    return user;
  } catch (error) {
    this.metrics.recordDatabaseQuery('SELECT', 'users', Date.now() - start);
    throw error;
  }
}
```

---

## 🎓 Phỏng Vấn QA

### Q1: Tại sao cần 4 logging tools (Winston, Elasticsearch, Loki, Sentry)?

**A**: Mỗi cái phục vụ mục đích khác:

| Tool              | Mục Đích              | Ưu Điểm                      |
| ----------------- | --------------------- | ---------------------------- |
| **Winston**       | Ghi logs chi tiết     | Real-time, flexible formats  |
| **Elasticsearch** | Full-text search logs | Powerful queries, analytics  |
| **Loki**          | Label-based search    | Low overhead, Grafana native |
| **Sentry**        | Error tracking        | Alerts ngay, source maps     |

**Best Practice**:

- Logs chi tiết → Elasticsearch (analytics)
- Application errors → Sentry (alerts)
- Aggregated logs → Loki (dashboard integration)

### Q2: Prometheus vs Elasticsearch - khi nào dùng cái nào?

**A**:

```
PROMETHEUS (Time-Series)
├─ Metrics: CPU, Memory, Request Rate
├─ Queries: rate(), histogram_quantile()
└─ Use: Real-time monitoring, alerting

ELASTICSEARCH (Document Store)
├─ Data: Full log lines, unstructured data
├─ Queries: Full-text search, aggregations
└─ Use: Historical analysis, root cause
```

\*\*Comb

inе\*\*:

- Prometheus = Real-time metrics + alerts
- Elasticsearch = Historical analysis + debugging

### Q3: Distributed Tracing (Jaeger) dùng khi nào?

**A**: Trace requests across microservices:

```
Request → API Gateway (10ms)
        → Auth Service (30ms) ← gRPC call
        → Video Service (150ms) ← gRPC + DB
        → Response (190ms total)

Jaeger shows:
- Each service execution time
- Network latency
- Bottleneck (Video Service)
```

### Q4: Alertmanager routing strategy?

**A**:

```yaml
routes:
  - match:
      severity: critical
    receiver: pagerduty # 1 min, SMS
    repeat_interval: 5m

  - match:
      severity: warning
    receiver: slack # 1 hour, Slack
    repeat_interval: 1h
```

**Best Practice**:

- Critical (>10% error rate) → PagerDuty + SMS
- Warning (>5% error rate) → Slack
- Info → Email digest

### Q5: Production logging best practices?

**A**:

```typescript
// ✅ GOOD - Structured logging
this.logger.error('Payment failed', error, {
  userId: '123',
  amount: 100,
  retryCount: 2,
  severity: 'high',
});

// ❌ BAD - Unstructured
console.log('error: ' + error.message);

// ✅ GOOD - Log levels
this.logger.debug('Cache hit'); // Dev only
this.logger.log('User registered'); // Info
this.logger.warn('Retry #2'); // Attention needed
this.logger.error('DB connection failed'); // Critical

// ❌ BAD
this.logger.log('everything');
```

### Q6: RecordingRules optimization - tại sao cần?

**A**:

```promql
// Expensive query (evaluated at query time)
histogram_quantile(0.95,
  rate(http_request_duration_seconds_bucket[5m])
)
// Evaluates 1000s of time series per second

// Recording rule (pre-computed every minute)
- record: http:request_duration:p95
  expr: histogram_quantile(0.95, rate(...))

// Query just returns pre-computed value
http:request_duration:p95  // Much faster!
```

**Use RecordingRules for**:

- Expensive aggregations
- Frequently used queries
- Dashboard panels (refresh every 10s)

### Q7: Log retention policy?

**A**:

```
Console:      Real-time (24 hours in memory)
Files:        14 days (local backup)
Elasticsearch: 30-90 days (configurable)
Sentry:       30 days (free tier)
```

**Production Strategy**:

- Hot data: Last 7 days in ES (fast queries)
- Warm data: 7-30 days (slower storage)
- Cold data: Archive to S3/GCS (compliance)

### Q8: Alert fatigue - quá nhiều alerts?

**A**:

```yaml
# ❌ MANY ALERTS
- alert: ErrorIncrease
  expr: errors > 0  # Fires every error!

# ✅ SMART ALERTS
- alert: HighErrorRate
  expr: rate(errors[5m]) / rate(total[5m]) > 0.05
  for: 5m  # Only if sustained

# ✅ GROUPING
group_by: [alertname, route]  # Deduplicate
group_wait: 10s               # Wait for similar alerts
group_interval: 5m            # Group updates
```

### Q9: Trace sampling strategy?

**A**:

```typescript
// Trace 100% in dev
SENTRY_TRACES_SAMPLE_RATE = 0.01; // 1% in prod

// OR selective sampling
if (isSlowRequest) {
  trace = sentry.startTransaction(); // Trace slow paths
}
```

**Why**:

- 100% = storage expensive
- 1-10% = catch most issues
- Selective = trace only important paths

### Q10: Grafana best practices?

**A**:

```
Layout:
┌──────────────────────────────┐
│  Key Metrics (Top)           │  ← SLI/SLO summary
├──────────┬──────────────────┤
│ Requests │ Errors & Latency │
├──────────┼──────────────────┤
│ CPU/Mem  │ Database         │
└──────────┴──────────────────┘

Refresh Rate:
- System metrics: 30s
- Application: 10-15s
- Custom: On demand
```

---

## 📋 Production Checklist

- [ ] Prometheus retention: 30 days
- [ ] Elasticsearch index rotation: daily
- [ ] Alert routing: Critical → PagerDuty
- [ ] Dashboards: K8s-ready
- [ ] Recording rules: Loaded
- [ ] Jaeger sampling: 1-5%
- [ ] Log levels: INFO for prod
- [ ] Backup: Alertmanager state

---

**Happy Monitoring! 🎉**
