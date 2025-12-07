# 🚀 Monitoring & Logging Stack - Complete Setup Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Usage](#usage)
6. [Monitoring](#monitoring)
7. [Alerting](#alerting)
8. [Troubleshooting](#troubleshooting)

---

## 📊 Overview

Hệ thống monitoring & logging toàn diện cho TikTok Clone sử dụng stack hiện đại nhất:

| Component            | Purpose                    | Tech Stack                             |
| -------------------- | -------------------------- | -------------------------------------- |
| **Logging**          | Application logs           | Winston, Pino, Logstash, Elasticsearch |
| **Metrics**          | Performance metrics        | Prometheus, prom-client                |
| **Visualization**    | Dashboards & analysis      | Grafana, Kibana                        |
| **Alerting**         | Alert management           | Alertmanager, Sentry                   |
| **Error Tracking**   | Error reporting & tracking | Sentry                                 |
| **Infra Monitoring** | Database & cache metrics   | postgres_exporter, redis_exporter      |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    NestJS Applications                  │
│  ┌──────────────┬──────────────┬────────────────────┐  │
│  │ API Gateway  │ Auth Service │ Video Service  ... │  │
│  └──────────────┴──────────────┴────────────────────┘  │
└──────────────┬──────────────────────────────────────────┘
               │
      ┌────────┴────────────┬─────────────────┐
      │                     │                 │
      ▼                     ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌─────────────────┐
│   Winston    │  │  prom-client │  │  Sentry SDK     │
│   Logger     │  │   Metrics    │  │  (HTTP Client)  │
└──────────────┘  └──────────────┘  └─────────────────┘
      │                     │                 │
      ├─────────────────────┼─────────────────┤
      │                     │                 │
      ▼                     ▼                 ▼
┌─────────────────────┐  ┌──────────────┐  ┌──────────────┐
│   Log Aggregation   │  │  Prometheus  │  │  Sentry      │
│  (Elasticsearch)    │  │  (Scraping)  │  │  (Cloud)     │
└─────────────────────┘  └──────────────┘  └──────────────┘
      │                     │
      ├─────────────────────┤
      │                     │
      ▼                     ▼
   ┌─────────────────────────────┐
   │        Grafana              │
   │   (Unified Dashboard)       │
   │  - Logs (Loki, ES)          │
   │  - Metrics (Prometheus)     │
   │  - Alerts (Alertmanager)    │
   └─────────────────────────────┘
      │          │
      ▼          ▼
   Kibana    Alertmanager
```

---

## 🔧 Installation

### Prerequisites

```bash
# Check Docker
docker --version   # v20.10+
docker-compose --version  # v2.0+

# Check Node.js
node --version    # v18+
npm --version     # v9+
```

### Step 1: Clone & Setup Environment

```bash
git clone <repo>
cd tiktok_nestjs

# Copy env template
cp .env.example .env
cp .env.monitoring .env  # For monitoring config
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Create Required Directories

```bash
mkdir -p logs
mkdir -p monitoring/grafana/{provisioning/{datasources,dashboards},dashboards}
```

### Step 4: Start Services

#### Option A: PowerShell (Windows)

```powershell
cd scripts
.\setup-monitoring.ps1
```

#### Option B: Bash (Linux/Mac)

```bash
cd scripts
bash setup-monitoring.sh
```

#### Option C: Manual

```bash
# Start infrastructure
docker-compose -f docker-compose.yml up -d postgres redis kafka

# Wait for services
Start-Sleep -Seconds 10

# Run migrations
npm run migration:run

# Start all services
docker-compose -f docker-compose.yml up -d

# Start monitoring
docker-compose -f docker-compose.monitoring.yml up -d
```

---

## ⚙️ Configuration

### Environment Variables

Tạo `.env.monitoring`:

```env
# ========================
# Logging Configuration
# ========================
LOG_LEVEL=debug
ELASTICSEARCH_NODE=http://elasticsearch:9200
ELASTICSEARCH_USER=elastic
ELASTICSEARCH_PASSWORD=changeme

# ========================
# Sentry Configuration
# ========================
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILING_ENABLED=true

# ========================
# Alert Configuration
# ========================
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
PAGERDUTY_SERVICE_KEY=YOUR_SERVICE_KEY
```

### Prometheus Configuration

File: `monitoring/prometheus.yml`

- Auto-discovers services
- Scrapes metrics mỗi 15 giây
- Reads alert rules từ `alert_rules.yml`

### Alert Rules

File: `monitoring/alert_rules.yml`

Pre-configured alerts cho:

- ✅ High error rates
- ✅ Slow response times
- ✅ Database performance
- ✅ Cache hit rates
- ✅ System resources
- ✅ Service health

### Grafana Datasources

File: `monitoring/grafana/provisioning/datasources/datasources.yml`

Auto-provisioned:

- Prometheus
- Elasticsearch
- Loki

---

## 💻 Usage

### 1. Using Logger in Services

```typescript
import { CustomLoggerService } from '@app/common/logging';

@Injectable()
export class UserService {
  constructor(private logger: CustomLoggerService) {
    this.logger.setContext('UserService');
  }

  async getUser(id: string) {
    this.logger.log('Fetching user', { userId: id });

    try {
      const user = await this.userRepository.findOne(id);
      this.logger.log('User fetched successfully', { userId: id });
      return user;
    } catch (error) {
      this.logger.error('Failed to fetch user', error, { userId: id });
      throw error;
    }
  }
}
```

### 2. Recording Metrics

```typescript
import { MetricsService } from '@app/common/logging';

@Injectable()
export class DataService {
  constructor(private metrics: MetricsService) {}

  async processData() {
    const startTime = Date.now();

    try {
      // Your processing
      const result = await this.doSomething();

      // Record success
      const duration = Date.now() - startTime;
      this.metrics.recordDatabaseQuery('INSERT', 'data', duration);

      return result;
    } catch (error) {
      // Still record the duration
      const duration = Date.now() - startTime;
      this.metrics.recordDatabaseQuery('INSERT', 'data', duration);
      throw error;
    }
  }
}
```

### 3. Sentry Error Tracking

```typescript
import { SentryService } from '@app/common/logging';

@Injectable()
export class PaymentService {
  constructor(private sentry: SentryService) {}

  async processPayment(userId: string) {
    // Set user context for Sentry
    this.sentry.setUser({
      id: userId,
      email: 'user@example.com',
    });

    try {
      // Payment processing
    } catch (error) {
      // Capture with context
      this.sentry.captureException(error, {
        userId,
        operation: 'payment_processing',
        amount: 100,
      });

      throw error;
    }
  }
}
```

### 4. Performance Monitoring

```typescript
async complexOperation() {
  const transaction = this.sentry.startTransaction(
    'complex_operation',
    'http.request'
  );

  try {
    // Your operation
    await this.doComplexWork();
    transaction.setStatus('ok');
  } catch (error) {
    transaction.setStatus('error');
    this.sentry.captureException(error);
  } finally {
    transaction.finish();
  }
}
```

---

## 📊 Monitoring

### Grafana Dashboards

**URL**: http://localhost:3005
**Credentials**: admin / admin123

#### Pre-built Dashboards

1. **Service Metrics**
   - Request rate
   - Error rate
   - Response time (P95)
   - Active connections

#### Create Custom Dashboard

```promql
# Request rate
rate(http_requests_total[5m])

# Error rate percentage
(sum(rate(http_request_errors_total[5m])) / sum(rate(http_requests_total[5m]))) * 100

# Response time P95
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Cache hit rate
sum(rate(cache_hits_total[5m])) / (sum(rate(cache_hits_total[5m])) + sum(rate(cache_misses_total[5m])))

# Database query duration P99
histogram_quantile(0.99, rate(database_query_duration_seconds_bucket[5m]))

# Active connections by type
active_connections

# Message queue backlog
message_queue_size
```

### Prometheus

**URL**: http://localhost:9090

- View all metrics: http://localhost:9090/graph
- Check targets: http://localhost:9090/targets
- View rules: http://localhost:9090/rules

### Kibana (Elasticsearch)

**URL**: http://localhost:5601

#### Search Logs

```
service: "auth-service" AND level: "error"
```

```
timestamp: [NOW-1h TO NOW] AND status: 500
```

```
method: "POST" AND duration: > 1000
```

### Loki (via Grafana)

1. Go to Grafana: http://localhost:3005
2. Click "Explore"
3. Select "Loki" datasource
4. Use LogQL:

```
{job="api-gateway"} | json | level="error"
```

```
{service="video-service"} | duration > 5000ms
```

---

## 🚨 Alerting

### Alert Types

| Alert                   | Trigger              | Action            |
| ----------------------- | -------------------- | ----------------- |
| **High Error Rate**     | >5% errors in 5min   | Slack warning     |
| **Critical Error Rate** | >10% errors in 2min  | Slack + PagerDuty |
| **Slow Response**       | P95 > 2s             | Slack warning     |
| **DB Slow Queries**     | >1s query time       | Slack warning     |
| **Service Down**        | No response for 1min | Slack critical    |
| **Memory Critical**     | >90% usage           | Slack critical    |

### Alertmanager

**URL**: http://localhost:9093

- View active alerts
- View alert groups
- Test notifications

### Setup Slack Notifications

1. Create Slack Webhook:
   - Go to https://api.slack.com/apps
   - Create new app
   - Enable Incoming Webhooks
   - Add New Webhook

2. Set environment variable:

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

3. Restart services

### PagerDuty Integration

1. Create PagerDuty integration key
2. Set environment variable:

```env
PAGERDUTY_SERVICE_KEY=YOUR_KEY
```

3. Restart Alertmanager

---

## 🔍 Querying Logs

### Elasticsearch Query Examples

```json
// All errors in the last hour
{
  "query": {
    "bool": {
      "must": [
        { "match": { "level": "error" } },
        { "range": { "@timestamp": { "gte": "now-1h" } } }
      ]
    }
  }
}

// Errors by service
{
  "query": { "match": { "level": "error" } },
  "aggs": {
    "services": {
      "terms": { "field": "service.keyword" }
    }
  }
}

// Response time stats
{
  "query": { "match_all": {} },
  "aggs": {
    "response_time": {
      "extended_stats": { "field": "duration" }
    }
  }
}
```

### Prometheus Query Examples

```promql
# Requests per second
rate(http_requests_total[1m])

# Error rate
rate(http_request_errors_total[5m]) / rate(http_requests_total[5m])

# Response time quantiles
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Top 5 slow endpoints
topk(5, http_request_duration_seconds_bucket{le="5"})

# Service availability
up{job=~".*service"}

# Database connections
pg_stat_activity_count
```

---

## 🐛 Troubleshooting

### Services won't start

```bash
# Check Docker daemon
docker ps

# View service logs
docker logs tiktok_elasticsearch
docker logs tiktok_prometheus
docker logs tiktok_grafana

# Restart services
docker-compose down
docker volume prune
docker-compose up -d
```

### Metrics not appearing

1. Check if service exposes metrics:

```bash
curl http://localhost:3000/metrics
```

2. Check Prometheus targets:
   - Go to http://localhost:9090/targets
   - Verify status = "UP"

3. Check service logs:

```bash
docker logs tiktok_api_gateway
```

### Logs not appearing in Kibana

1. Check Elasticsearch:

```bash
curl http://localhost:9200/_cluster/health
curl http://localhost:9200/_cat/indices
```

2. Check Logstash:

```bash
docker logs tiktok_logstash
```

3. Check if logs directory exists:

```bash
ls -la logs/
```

### High memory usage in Elasticsearch

```bash
# Reduce Java heap
docker-compose.monitoring.yml:
  elasticsearch:
    environment:
      - "ES_JAVA_OPTS=-Xms256m -Xmx256m"

# Reduce index retention
curl -X PUT http://localhost:9200/logs-*/_settings -H 'Content-Type: application/json' -d '{
  "index.codec": "best_compression"
}'
```

### Alertmanager not sending notifications

1. Check configuration:

```bash
curl http://localhost:9093/api/v1/status
```

2. Test webhook:

```bash
curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
  -H 'Content-type: application/json' \
  -d '{"text":"Test alert"}'
```

---

## 📚 Additional Resources

- [Prometheus Best Practices](https://prometheus.io/docs/practices/histograms/)
- [Grafana Dashboard Guide](https://grafana.com/docs/grafana/latest/dashboards/)
- [Elasticsearch Query DSL](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html)
- [Sentry Documentation](https://docs.sentry.io/)
- [Winston Logger](https://github.com/winstonjs/winston)

---

**Last Updated**: December 2024
**Version**: 1.0.0
