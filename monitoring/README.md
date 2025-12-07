# TikTok Clone - Monitoring & Logging Setup

Hướng dẫn cấu hình monitoring stack hiện đại nhất cho ứng dụng TikTok Clone.

## 📊 Stack Công nghệ

### Logging & Log Aggregation

- **Winston + Pino**: Application logging
- **Elasticsearch**: Log storage
- **Logstash**: Log processing & transformation
- **Kibana**: Log visualization & analysis
- **Loki**: Lightweight log aggregation (Grafana integration)
- **Promtail**: Log shipper for Loki

### Metrics & Monitoring

- **Prometheus**: Time-series database & metrics scraper
- **prom-client**: NestJS metrics client
- **Grafana**: Dashboard & visualization

### Alerting & Error Tracking

- **Alertmanager**: Alert management & routing
- **Sentry**: Error tracking & performance monitoring

### Infrastructure Monitoring

- **postgres_exporter**: PostgreSQL metrics
- **redis_exporter**: Redis metrics

## 🚀 Quick Start

### 1. Setup Monitoring Stack (Windows - PowerShell)

```powershell
cd scripts
.\setup-monitoring.ps1
```

### 2. Setup Monitoring Stack (Linux/Mac - Bash)

```bash
cd scripts
bash setup-monitoring.sh
```

### 3. Manual Setup

```bash
# Install dependencies
npm install

# Build project
npm run build

# Start infrastructure
docker-compose -f docker-compose.yml up -d postgres redis kafka

# Wait for services
sleep 10

# Run migrations
npm run migration:run

# Start all services
docker-compose -f docker-compose.yml up -d

# Start monitoring services
docker-compose -f docker-compose.monitoring.yml up -d
```

## 🔗 Access URLs

| Service       | URL                   | Credentials      |
| ------------- | --------------------- | ---------------- |
| Grafana       | http://localhost:3005 | admin / admin123 |
| Prometheus    | http://localhost:9090 | -                |
| Kibana        | http://localhost:5601 | -                |
| Alertmanager  | http://localhost:9093 | -                |
| Elasticsearch | http://localhost:9200 | -                |
| Loki          | http://localhost:3100 | -                |

## 📈 Metrics Endpoints

Mỗi service expose metrics tại `/metrics`:

```
http://localhost:3000/metrics (API Gateway)
http://localhost:3001/metrics (Auth Service)
http://localhost:3002/metrics (Video Service)
http://localhost:3003/metrics (Interaction Service)
http://localhost:3004/metrics (Notification Service)
```

## 🔧 Configuration

### Environment Variables

Tạo `.env.monitoring` file:

```env
# Logging
LOG_LEVEL=debug
ELASTICSEARCH_NODE=http://elasticsearch:9200
ELASTICSEARCH_USER=elastic
ELASTICSEARCH_PASSWORD=changeme

# Sentry
SENTRY_DSN=https://YOUR_SENTRY_DSN@sentry.io/PROJECT_ID
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILING_ENABLED=true

# Alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
PAGERDUTY_SERVICE_KEY=YOUR_PAGERDUTY_KEY
```

### Prometheus Configuration

File: `monitoring/prometheus.yml`

Đã config để scrape metrics từ tất cả services:

- API Gateway
- Auth Service
- Video Service
- Interaction Service
- Notification Service
- Elasticsearch
- PostgreSQL
- Redis

### Alert Rules

File: `monitoring/alert_rules.yml`

Có sẵn các rules cho:

- High error rate
- Slow response time
- Database query performance
- Cache hit rate
- Service health
- System resources

### Alertmanager Configuration

File: `monitoring/alertmanager.yml`

Routing rules cho:

- Critical alerts → Slack + PagerDuty
- Warning alerts → Slack
- Inhibit rules để tránh alert spam

## 📚 Integration in NestJS Apps

### 1. Import Logger Module

```typescript
import { LoggerModule } from '@app/common/logging';

@Module({
  imports: [LoggerModule],
})
export class AppModule {}
```

### 2. Use Custom Logger

```typescript
import { CustomLoggerService, LoggingInterceptor, MetricsService } from '@app/common/logging';

@Controller('api')
export class AppController {
  constructor(
    private logger: CustomLoggerService,
    private metrics: MetricsService,
  ) {
    this.logger.setContext('AppController');
  }

  @Get('test')
  test() {
    this.logger.log('Test endpoint called');
    this.metrics.recordCacheHit('redis');
    return { message: 'success' };
  }
}
```

### 3. Register Global Interceptor

```typescript
import { LoggingInterceptor } from '@app/common/logging';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new LoggingInterceptor(...));
  await app.listen(3000);
}
bootstrap();
```

### 4. Sentry Integration

```typescript
import { SentryService } from '@app/common/logging';

@Controller('api')
export class AppController {
  constructor(private sentry: SentryService) {}

  @Get('test')
  test() {
    try {
      // Your code
    } catch (error) {
      this.sentry.captureException(error, {
        userId: 'user123',
        endpoint: '/api/test',
      });
    }
  }
}
```

## 📊 Grafana Dashboards

### Pre-configured Dashboards

1. **Service Metrics** - Request rate, error rate, response time, connections
2. Add more dashboards in: `monitoring/grafana/dashboards/`

### Create New Dashboard

1. Đăng nhập Grafana: http://localhost:3005
2. Click "+" → "Dashboard"
3. Add panels với queries:

```promql
# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_request_errors_total[5m])

# Response time P95
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Cache hit rate
sum(rate(cache_hits_total[5m])) / (sum(rate(cache_hits_total[5m])) + sum(rate(cache_misses_total[5m])))

# Active connections
active_connections

# Database query time
histogram_quantile(0.95, rate(database_query_duration_seconds_bucket[5m]))
```

## 🔍 Log Searching

### Kibana (Elasticsearch)

1. Truy cập: http://localhost:5601
2. Index Pattern: `logs-*`
3. Search logs:
   ```
   service: "auth-service" AND level: "error"
   ```

### Grafana Loki

1. Truy cập: http://localhost:3005 → Explore
2. Select Loki datasource
3. LogQL queries:

```
{job="api-gateway"} | json | level="error"
```

## 🚨 Alert Examples

### Slack Notifications

Configure webhook URL trong `.env.monitoring`:

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Alert Triggers

- Error rate > 5% in 5 minutes → Warning
- Error rate > 10% in 2 minutes → Critical
- Response time P95 > 2s → Warning
- Database queries > 1s → Warning

## 🛠️ Troubleshooting

### Services không start

```bash
# Check logs
docker logs tiktok_elasticsearch
docker logs tiktok_grafana
docker logs tiktok_prometheus

# Restart services
docker-compose down
docker-compose up -d
```

### Metrics không hiển thị

1. Kiểm tra service có expose metrics:

   ```bash
   curl http://localhost:3000/metrics
   ```

2. Kiểm tra Prometheus scraping:
   - Truy cập http://localhost:9090/targets
   - Verify status = "UP"

### Logs không ship to Elasticsearch

1. Kiểm tra Elasticsearch:

   ```bash
   curl http://localhost:9200/_cluster/health
   ```

2. Kiểm tra Logstash logs:
   ```bash
   docker logs tiktok_logstash
   ```

## 📝 Best Practices

### Logging

```typescript
// ✅ Good
this.logger.log('User login successful', {
  userId: 'user123',
  timestamp: new Date(),
  ip: request.ip,
});

// ❌ Avoid
console.log('something happened');
this.logger.log('error: ' + error.message);
```

### Metrics

```typescript
// ✅ Good
this.metrics.recordHttpRequest(method, route, status, duration);
this.metrics.recordDatabaseQuery('SELECT', 'users', duration);
this.metrics.recordCacheHit('redis');

// ❌ Avoid
// Manual metric tracking in multiple places
```

### Error Handling

```typescript
// ✅ Good
try {
  // code
} catch (error) {
  this.logger.error('Operation failed', error, { context: 'critical' });
  this.sentry.captureException(error);
}

// ❌ Avoid
console.error(error);
```

## 📚 Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Elasticsearch Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/)
- [Sentry Documentation](https://docs.sentry.io/)
- [Winston Documentation](https://github.com/winstonjs/winston)
- [prom-client Documentation](https://github.com/siimon/prom-client)

## 🤝 Contributing

Nếu có bất kỳ issue hoặc improvement, vui lòng tạo issue hoặc PR.

---

**Last Updated**: December 7, 2025
**Version**: 1.0.0
