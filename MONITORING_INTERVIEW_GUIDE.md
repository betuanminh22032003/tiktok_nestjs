# 🎯 Monitoring Stack - Ngôn Ngữ Phỏng Vấn

## I. Kiến Trúc Tổng Quát

### 1. **Logging Pipeline** (Application → Visualization)

```
┌─────────────────────────────────────────────────────────────┐
│ NestJS Applications                                          │
│ ├─ @app/common/logging/logger.service.ts                  │
│ │  └─ Winston [Console | File | Elasticsearch Transport] │
│ └─ HTTP Interceptor + Middleware (Automatic)             │
└─────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┼─────────────────────┐
        ↓                     ↓                     ↓
   [Logstash]          [Loki Agent]          [Sentry SDK]
   (Processing)        (Shipping)            (Errors)
        ↓                     ↓                     ↓
   [Elasticsearch]      [Loki DB]             [Sentry]
   (Storage)            (Storage)             (Storage)
        ↓                     ↓                     ↓
   [Kibana]             [Grafana]             [Sentry UI]
   (Analytics)          (Dashboard)           (Alerting)
```

### 2. **Metrics Pipeline** (Prometheus)

```
┌─────────────────────────────────────────────────────────────┐
│ NestJS Services                                              │
│ ├─ prom-client library (Counters, Histograms, Gauges)      │
│ └─ /metrics endpoint on each service                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
                    [Prometheus Scraper]
                    (Pulls every 15s)
                              ↓
                    [Time-Series Database]
                    (30-day retention)
                              ↓
        ┌───────────────────┬───────────────────┐
        ↓                   ↓                   ↓
   [Recording Rules]  [Alert Rules]      [Grafana Queries]
   (Pre-computed)     (Detect issues)    (Dashboard)
```

---

## II. Các Thành Phần Chính & So Sánh

### A. **Logging Tools**

| Thành Phần        | Role           | Output             | Mục Đích                       |
| ----------------- | -------------- | ------------------ | ------------------------------ |
| **Winston**       | App Logger     | Structured JSON    | Capture chi tiết mọi sự kiện   |
| **Logstash**      | Log Processor  | Parsed Events      | Filter, enrich, transform logs |
| **Elasticsearch** | Log Storage    | Indexed Documents  | Full-text search, analytics    |
| **Kibana**        | Log UI         | Search Interface   | Tìm root cause từ logs         |
| **Loki**          | Log Aggregator | Label-indexed Logs | Lightweight, Grafana-native    |
| **Promtail**      | Log Shipper    | Forwarded Logs     | Gửi logs đến Loki              |

**Khi nào dùng gì?**

- **Chỉ cần logging đơn giản**: Winston + File
- **Cần search logs**: Winston + Logstash + Elasticsearch + Kibana
- **Tối ưu chi phí + Grafana**: Winston + Loki + Promtail

### B. **Monitoring Tools**

| Thành Phần          | Tính Năng            | Giá Trị                        |
| ------------------- | -------------------- | ------------------------------ |
| **Prometheus**      | Metrics TSDB         | Real-time time-series data     |
| **Grafana**         | Visualization        | Unified dashboard              |
| **Recording Rules** | Pre-computed Queries | Faster queries, reduced load   |
| **Alert Rules**     | Alert Conditions     | Detect problems early          |
| **Alertmanager**    | Alert Routing        | Route alerts to right channels |

### C. **Error Tracking & Tracing**

| Thành Phần        | Capture    | Alert     | Trace               |
| ----------------- | ---------- | --------- | ------------------- |
| **Sentry**        | Exceptions | Immediate | Error source        |
| **Jaeger**        | Requests   | No        | Latency per service |
| **Elasticsearch** | All logs   | Manual    | Trace via log IDs   |

---

## III. Cách Hoạt Động Chi Tiết

### **Flow 1: User gặp lỗi**

```
1. User hits API endpoint
   ↓
2. @LoggingInterceptor logs request
   ↓
3. Error occurs (NotFoundException)
   ↓
4. SentryService catches exception
   ↓
5. Sentry sends alert to Slack
   ↓
6. Winston logs: { level: 'error', message: '...', error: {...} }
   ↓
7. Logstash parses the error
   ↓
8. Elasticsearch stores structured log
   ↓
9. Engineer searches Kibana for 'NotFoundException'
   ↓
10. Finds root cause → Fix → Deploy
```

### **Flow 2: Slow queries detected**

```
1. Database query takes 2 seconds (vs 100ms average)
   ↓
2. MetricsService records:
   - http_request_duration_seconds histogram
   - database_query_duration_seconds histogram
   ↓
3. Prometheus scrapes metrics every 15s
   ↓
4. Recording rule evaluates:
   histogram_quantile(0.95, database_query_duration_seconds)
   Result: 1500ms (above threshold)
   ↓
5. Alert rule triggers: database_query_slow
   ↓
6. Alertmanager routes to Slack + PagerDuty
   ↓
7. On-call engineer gets alert
   ↓
8. Checks Grafana dashboard → sees database is overloaded
   ↓
9. Scales database or optimizes query
```

### **Flow 3: Service-to-service request (Jaeger tracing)**

```
Client Request
  ↓ [Jaeger Instrumentation]
┌─ API Gateway (span_id: 1)  │ 10ms
│  └─ Authenticate call      │ 30ms
│     └─ Auth Service        │ 20ms
│  └─ Fetch Video call       │ 150ms
│     └─ Video Service       │ 140ms
│        └─ PostgreSQL query │ 80ms
├─ Response assembly         │ 5ms
↓
Total Latency: 195ms

Jaeger shows:
- Each span with timing
- Which service is bottleneck (Video Service: 140ms)
- Network overhead (10ms waiting)
```

---

## IV. Advanced Concepts

### **1. Recording Rules - Tại sao quan trọng?**

```promql
// Without Recording Rules (Expensive)
histogram_quantile(
  0.95,
  rate(http_request_duration_seconds_bucket[5m])
)

Cost: Must evaluate 10,000 time series every time query runs
Latency: Dashboard refresh slow (1-5s per panel)


// With Recording Rules (Optimized)
- record: http:request_duration:p95
  interval: 1m
  expr: histogram_quantile(0.95, rate(...))

Then query just: http:request_duration:p95
Cost: Pre-computed every minute
Latency: Fast response (ms)
```

### **2. Alert Fatigue Management**

```yaml
# Problem: Too many alerts (boy who cried wolf)
- alert: ErrorOccurred
  expr: errors > 0 # Fires millions of times daily

# Solution: Smart thresholds + Duration
- alert: HighErrorRate
  expr: rate(errors[5m]) / rate(total[5m]) > 0.05
  for: 5m # Only if sustained for 5 minutes
  annotations:
    summary: 'Error rate {{ $value }}% for 5m'
```

### **3. Log Sampling Strategy**

```
Production vs Development:
┌──────────────────────────────────────┐
│ DEV                                  │
│ Log Level: DEBUG (very verbose)     │
│ Retention: 1 day (local)            │
│ Elasticsearch: None                 │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ PRODUCTION                           │
│ Log Level: INFO (critical events)   │
│ Retention: 30 days (hot), 90 (warm) │
│ Elasticsearch: All INFO+ logs       │
│ Sampling: 1% of trace_ids for Jaeger
└──────────────────────────────────────┘

Result: Balanced debugging + cost-efficiency
```

### **4. SLI vs SLO vs Alert Threshold**

```
┌─ SLI (Service Level Indicator) ──────────────┐
│ "P95 latency is 200ms"                       │
│ "Error rate is 0.1%"                         │
└──────────────────────────────────────────────┘

┌─ SLO (Service Level Objective) ──────────────┐
│ "P95 latency < 200ms, 99.9% of time"        │
│ "Error rate < 0.1%, 99.9% of time"          │
└──────────────────────────────────────────────┘

┌─ Alert Threshold ────────────────────────────┐
│ When: P95 latency > 300ms for 5m             │
│ When: Error rate > 1%                        │
│ (More aggressive than SLO to catch issues)   │
└──────────────────────────────────────────────┘
```

---

## V. Phỏng Vấn - Common Questions

### **Q1: "Describe logging architecture in your project"**

**A (Structured Answer)**:

```
我们使用 ELK Stack (Elasticsearch + Logstash + Kibana) 配合 Winston:

1. Application Layer:
   - Winston logger captures structured logs
   - Automatic HTTP interceptor logs requests
   - Different transports: console, file rotation, Elasticsearch

2. Processing Layer:
   - Logstash receives logs via syslog/file input
   - Parses JSON format, extracts fields
   - Enriches with service name, environment

3. Storage Layer:
   - Elasticsearch indexes logs (searchable)
   - Index rotation daily (optimize storage)
   - Time-based index: logs-YYYY.MM.dd

4. Visualization:
   - Kibana provides search interface
   - Create dashboards for specific services
   - Alert when error_count > threshold

Benefits:
- Centralized logging across microservices
- Full-text search for debugging
- Historical analysis for performance tuning
```

### **Q2: "How do you handle high volume logging?"**

**A**:

```
Challenge: 1000 requests/sec = millions of logs/day

Solution:

1. Log Sampling
   - Log 100% of ERRORS always
   - Log 10% of INFO level
   - Skip DEBUG in production

2. Async Logging
   - Winston uses buffer (don't block requests)
   - Batch sends to Elasticsearch

3. Log Rotation
   - Daily index rotation
   - Archive old indexes to S3

4. Filtering
   - Health check logs (exclude from Elasticsearch)
   - Keep only relevant fields
```

### **Q3: "Sentry vs Elasticsearch for error tracking"**

**A**:

```
Elasticsearch:
✅ All logs + searchable
✅ Historical analysis
❌ Manual alert setup
❌ Noise from INFO/DEBUG

Sentry:
✅ Real-time error alerts
✅ Source maps, stack traces
✅ Automatic alert grouping
❌ Expensive for high volume
❌ Limited log searching

Best Practice:
- Use BOTH
- Sentry: Real-time + alerts
- Elasticsearch: Historical + analysis
```

### **Q4: "Recording rules - why needed?"**

**A**:

```
Without Recording Rules:
- Dashboard with 10 panels
- Each panel runs complex query
- Prometheus evaluates 50,000 time series per query
- Refresh takes 10 seconds ❌

With Recording Rules:
- Pre-compute expensive queries every minute
- Store results as new time series
- Dashboard just queries pre-computed data
- Refresh takes 100ms ✅

Trade-off:
- Storage: +20% more disk (worth it)
- CPU: Spreads evaluation evenly
- Query latency: 100x faster
```

### **Q5: "How do you ensure alerts don't go to wrong team?"**

**A**:

```yaml
Alertmanager Routing:

route:
  receiver: 'default'
  routes:
    - match:
        service: auth
        severity: critical
      receiver: auth-team-pagerduty # Immediate
      group_wait: 10s

    - match:
        service: video
        severity: warning
      receiver: video-team-slack # Grouped
      group_wait: 30s

default_receiver: ops-team-slack

Result:
  - Auth team: Critical errors → PagerDuty SMS
  - Video team: Warnings → Slack (grouped, less noise)
  - Ops: Everything else → Default Slack
```

---

## VI. Practical Implementation Examples

### **Example 1: Logging a Database Error**

```typescript
@Injectable()
export class UserRepository {
  constructor(private logger: CustomLoggerService) {
    this.logger.setContext('UserRepository');
  }

  async findById(id: string) {
    try {
      return await this.db.query(`SELECT * FROM users WHERE id = $1`, [id]);
    } catch (error) {
      // Structured error log
      this.logger.error('Failed to find user', {
        userId: id,
        error: error.message,
        stack: error.stack,
        code: error.code,
      });
      // Automatically captured by Sentry too
      throw new InternalServerErrorException('Database error');
    }
  }
}

// In Elasticsearch:
{
  "timestamp": "2025-01-15T10:30:45Z",
  "level": "ERROR",
  "context": "UserRepository",
  "message": "Failed to find user",
  "userId": "123",
  "error": "column 'id' not found",
  "code": "42703"
}

// Query in Kibana:
"Failed to find user" AND code: 42703
-> Find all instances of this error
```

### **Example 2: Recording Custom Metrics**

```typescript
@Controller('/api/payments')
export class PaymentController {
  constructor(private metrics: MetricsService) {}

  @Post()
  async createPayment(@Body() dto: CreatePaymentDto) {
    const start = Date.now();

    try {
      const result = await this.paymentService.charge(dto);

      // Record success
      this.metrics.recordHttpRequest('POST', '/api/payments', 200, Date.now() - start);
      this.metrics.recordDatabaseQuery('INSERT', 'payments', Date.now() - start);

      return result;
    } catch (error) {
      // Record failure
      this.metrics.recordHttpRequest('POST', '/api/payments', 500, Date.now() - start);

      throw error;
    }
  }
}

// In Prometheus:
# HELP http_requests_total Total HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="POST",path="/api/payments",status="200"} 150
http_requests_total{method="POST",path="/api/payments",status="500"} 3

# HELP http_request_duration_seconds Request latency
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{path="/api/payments",le="0.1"} 100
http_request_duration_seconds_bucket{path="/api/payments",le="0.5"} 148
http_request_duration_seconds_bucket{path="/api/payments",le="1.0"} 150
```

---

## VII. Quick Reference - Interview Checklist

- [ ] Explain logging pipeline (Winston → Logstash → ES → Kibana)
- [ ] Explain metrics pipeline (prom-client → Prometheus → Grafana)
- [ ] Why Recording Rules? (Pre-computation for speed)
- [ ] Alert routing strategy (Critical vs Warning vs Info)
- [ ] Sentry vs Elasticsearch (Real-time vs Historical)
- [ ] Jaeger purpose (Distributed tracing for latency)
- [ ] Log sampling (100% errors, 10% info)
- [ ] SLI vs SLO (What vs Goal)
- [ ] Handle high volume (Sampling, async, rotation)
- [ ] Common monitoring mistakes (Too many alerts, no sampling, expensive queries)

---

**Created**: December 7, 2025
**Version**: 1.0 - Production Ready
