# 🎨 Monitoring Stack - Visual Reference Card

**Print this out or save for quick reference!**

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MICROSERVICES                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ API Gateway  │  │ Auth Service │  │ Video Service│ ...          │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
         │                    │                    │
         │ Winston Logs      │ Winston Logs      │ Winston Logs
         │ (structured JSON) │ (structured JSON) │ (structured JSON)
         │                    │                    │
         ├────────────────────┼────────────────────┤
         │
         ├─→ Logstash ────────────→ Elasticsearch ────→ Kibana
         │   (Processing)       (Indexing/Storage)    (Search UI)
         │
         ├─→ Loki ──────────→ Grafana (via Loki datasource)
         │   (Aggregation)
         │
         ├─→ /metrics ─→ Prometheus Scraper ─→ Recording Rules
         │   endpoint     (every 15s)          (pre-computed)
         │                        ↓
         │                Prometheus TSDB
         │   (Stores metrics 30 days)
         │                        ↓
         │                  Alert Rules
         │              (Detect issues)
         │                        ↓
         │                 Alertmanager
         │       (Route: Critical → PagerDuty
         │              Warning → Slack
         │                Info → Email)
         │
         ├─→ Request Trace → Jaeger (OTLP Protocol)
         │   (OpenTelemetry)   (Distributed Tracing)
         │
         └─→ Errors → Sentry SDK
             (Exceptions, Performance)


         ╔═════════════════════════════════════════════════════════╗
         ║         UNIFIED DASHBOARD (Grafana)                    ║
         ╠═════════════════════════════════════════════════════════╣
         ║  • Error Rate % (From Prometheus recording rules)       ║
         ║  • P95 Latency (From Prometheus recording rules)        ║
         ║  • Request Rate (Real-time from Prometheus)             ║
         ║  • Log search (Full-text from Elasticsearch)            ║
         ║  • Trace visualization (From Jaeger)                    ║
         ║  • Error breakdown (From Sentry)                        ║
         ╚═════════════════════════════════════════════════════════╝
```

---

## 🔀 Decision Tree: Which Tool to Use?

```
Need to...?
│
├─ Record every event in app?
│  └─→ Winston Logger (with 3 transports)
│
├─ Search through all logs later?
│  └─→ Elasticsearch + Kibana
│
├─ Lightweight log aggregation?
│  └─→ Loki (Lower resource cost)
│
├─ Get real-time metrics (CPU, memory, requests)?
│  └─→ Prometheus + prom-client
│
├─ Visualize metrics?
│  └─→ Grafana (queries Prometheus)
│
├─ Make queries super fast?
│  └─→ Recording Rules (pre-compute)
│
├─ Alert on issues?
│  └─→ Alert Rules → Alertmanager → Slack/PagerDuty
│
├─ Track exceptions in real-time?
│  └─→ Sentry (with source maps)
│
├─ Debug slow requests?
│  └─→ Jaeger (distributed tracing)
│
└─ Know which service is slow?
   └─→ Jaeger (shows latency per service)
```

---

## ⚡ Quick Commands

### Start Everything

```bash
# Main services
docker-compose up -d

# Monitoring stack
docker-compose -f docker-compose.monitoring.yml up -d

# Or both at once
docker-compose up -d && docker-compose -f docker-compose.monitoring.yml up -d
```

### Check Health

```bash
# All containers
docker ps | grep -E 'prometheus|grafana|elasticsearch|loki'

# Verify script (Windows)
pwsh scripts/verify-monitoring.ps1

# Manual checks
curl http://localhost:9090/-/healthy          # Prometheus
curl http://localhost:3005/api/health         # Grafana
curl http://localhost:9200/_cluster/health    # Elasticsearch
curl http://localhost:3100/ready               # Loki
curl http://localhost:16686/api/health        # Jaeger
curl http://localhost:9000/_health/           # Sentry
```

### Generate Test Data

```bash
# Generate logs
curl http://localhost:3000/api/test-error

# Generate metrics
for i in {1..10}; do curl -s http://localhost:3000/api/test & done

# Generate high error rate (triggers alert)
for i in {1..50}; do curl -s http://localhost:3000/api/test-error & done
```

### View Data

```bash
# Prometheus targets
curl http://localhost:9090/api/v1/targets

# Elasticsearch indices
curl http://localhost:9200/_cat/indices

# Prometheus recording rules
curl http://localhost:9090/api/v1/rules

# Alert status
curl http://localhost:9090/api/v1/alerts
```

---

## 📍 Service Ports & URLs

| Service                 | Port  | URL                    | Purpose            |
| ----------------------- | ----- | ---------------------- | ------------------ |
| **Prometheus**          | 9090  | http://localhost:9090  | Metrics database   |
| **Grafana**             | 3005  | http://localhost:3005  | Visualization      |
| **Elasticsearch**       | 9200  | http://localhost:9200  | Log storage        |
| **Kibana**              | 5601  | http://localhost:5601  | Log search UI      |
| **Loki**                | 3100  | http://localhost:3100  | Log aggregation    |
| **Promtail**            | -     | Internal only          | Log shipper        |
| **Jaeger UI**           | 16686 | http://localhost:16686 | Trace UI           |
| **Alertmanager**        | 9093  | http://localhost:9093  | Alert routing      |
| **Sentry**              | 9000  | http://localhost:9000  | Error tracking     |
| **Logstash**            | 5000  | localhost:5000         | Log input (syslog) |
| **PostgreSQL Exporter** | 9187  | localhost:9187         | DB metrics         |
| **Redis Exporter**      | 9121  | localhost:9121         | Cache metrics      |
| **Node Exporter**       | 9100  | localhost:9100         | System metrics     |

---

## 🎯 Metrics You're Collecting

### HTTP Metrics

```
http_requests_total           Counter   (Total requests)
http_request_errors_total     Counter   (Total errors)
http_request_duration_seconds Histogram (Latency distribution)
http_active_connections       Gauge     (Current connections)
```

### Database Metrics

```
database_query_duration_seconds Histogram (Query latency)
database_connections_used       Gauge     (Active connections)
database_slow_queries_total     Counter   (Queries > 1s)
```

### Cache Metrics

```
cache_hits_total     Counter (Successful lookups)
cache_misses_total   Counter (Failed lookups)
cache_size_bytes     Gauge   (Memory usage)
```

### System Metrics (node_exporter)

```
node_memory_MemAvailable_bytes    (Free memory)
node_memory_MemTotal_bytes         (Total memory)
node_cpu_seconds_total            (CPU time)
node_disk_free_bytes              (Free disk)
```

---

## 📈 PromQL Query Examples

### Simple Queries

```
# Total requests (all time)
http_requests_total

# Requests in last 5 minutes
rate(http_requests_total[5m])

# Error rate (%)
(rate(http_request_errors_total[5m]) / rate(http_requests_total[5m])) * 100

# P95 latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Memory usage %
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100
```

### Aggregated Queries

```
# Error rate by service
(rate(http_request_errors_total[5m]) / rate(http_requests_total[5m]))[by (service)] * 100

# Top 5 slowest endpoints
topk(5, histogram_quantile(0.95, http_request_duration_seconds_bucket))

# 99th percentile latency by path
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m])) by (path)
```

---

## 🚨 Alert Rules Summary

```yaml
Alert Name                    | Condition                  | Severity
──────────────────────────────┼────────────────────────────┼──────────
HighErrorRate                 | > 5% for 5m                | Critical
HighP95Latency                | > 500ms for 5m             | Warning
DatabaseConnectionExhausted   | > 80 connections           | Critical
CacheLowHitRatio              | < 50% for 10m              | Warning
PrometheusDown                | No heartbeat for 2m        | Critical
ElasticsearchDown             | Not responding for 1m      | Critical
HighMemoryUsage               | > 85% for 5m               | Warning
HighCPUUsage                  | > 80% for 5m               | Warning
DiskSpaceLow                  | < 10% free for 5m          | Warning
KafkaLag                      | > 10k messages             | Warning
```

---

## 🔔 Alert Routing

```yaml
CRITICAL (PagerDuty + SMS)
├─ Error rate > 5%
├─ Database connection exhausted
├─ Prometheus/Elasticsearch down
└─ P95 latency > 500ms

WARNING (Slack - Grouped)
├─ Error rate > 2%
├─ Memory > 85%
├─ Cache hit ratio < 50%
├─ Disk space < 10%
└─ High CPU usage

INFO (Email Digest)
├─ New deployments
├─ Scheduled maintenance
└─ Performance improvements
```

---

## 📚 Configuration Files at a Glance

```
📁 monitoring/
│
├── prometheus.yml                    ← Scrape configs + alert rules
├── alert_rules.yml                   ← 20+ alert definitions
├── prometheus-recording-rules.yml    ← 7 rule groups
├── alertmanager.yml                  ← Routing + Slack/PagerDuty
├── loki-config.yml                   ← Log aggregation settings
├── promtail-config.yml               ← Multi-source log shipping
├── logstash.conf                     ← Log processing pipeline
│
└── grafana/
    ├── provisioning/
    │   ├── datasources/datasources.yml  ← Auto-provision data sources
    │   └── dashboards/dashboards.yml    ← Dashboard provisioning
    └── dashboards/
        ├── service-metrics.json         ← Basic dashboard
        └── production-dashboard.json    ← Production dashboard
```

---

## 📋 Checklist: Did I Set It Up Correctly?

- [ ] All 15 containers running?
- [ ] Prometheus shows 15 scrape targets as "Up"?
- [ ] Grafana dashboards have data (not empty)?
- [ ] Can search logs in Kibana?
- [ ] Traces appearing in Jaeger?
- [ ] Errors appearing in Sentry?
- [ ] Slack receives test alert?
- [ ] Recording rules evaluated?
- [ ] Alert rules loaded?
- [ ] Logstash processing logs?

---

## 🎓 Study Tips for Interviews

### Know These Cold:

1. **Logging pipeline**: Winston → Logstash → Elasticsearch → Kibana
2. **Metrics pipeline**: prom-client → Prometheus → Grafana
3. **Recording rules**: Why they matter (speed + load reduction)
4. **Alert routing**: Critical vs Warning vs Info
5. **Distributed tracing**: Why Jaeger matters (bottleneck detection)

### Be Ready to Explain:

1. How logs flow from app to Kibana (5 minute explanation)
2. How metrics flow from app to Grafana (5 minute explanation)
3. Why 4 logging tools instead of just 1
4. How you'd debug a slow request (use Jaeger + Prometheus)
5. How you'd investigate an error spike (use Sentry + Kibana)

### Have Stories Ready:

1. Time you detected an issue via alerts
2. Time you debugged using logs
3. Time you optimized queries using recording rules
4. Time you prevented outage via monitoring

---

## 🆘 Troubleshooting Quick Links

| Problem                      | Solution                                 |
| ---------------------------- | ---------------------------------------- |
| Container won't start        | Check `docker logs <container>`          |
| Prometheus targets down      | Check service firewall + port            |
| No data in Grafana           | Check datasource URL in Settings         |
| Elasticsearch disk full      | Delete old indices or set ILM policy     |
| Alerts not firing            | Check Prometheus alert rules evaluation  |
| Slack not receiving alerts   | Verify webhook URL in alertmanager.yml   |
| Logs not appearing in Kibana | Check Logstash pipeline + index patterns |
| Traces not in Jaeger         | Check OTEL endpoint configuration        |

---

## 📞 Useful Resources

**In Your Repo**:

- `MONITORING_INTERVIEW_GUIDE.md` ← Detailed explanations
- `PRODUCTION_MONITORING_GUIDE.md` ← Full setup guide
- `MONITORING_CHECKLIST.md` ← Deployment steps
- `MONITORING_FINAL_SUMMARY.md` ← This is it!

**Official Docs**:

- Prometheus: https://prometheus.io/docs/
- Grafana: https://grafana.com/docs/
- PromQL: https://prometheus.io/docs/prometheus/latest/querying/basics/

---

## ✨ You're All Set!

**You now have**:
✅ Production-grade monitoring
✅ Complete documentation
✅ Interview preparation material
✅ Working code examples
✅ Deployment runbooks

**Next steps**:

1. Start the stack
2. Read the guides
3. Practice explaining it
4. Deploy to production
5. Ace that interview! 🎉

---

**Version**: 1.0
**Created**: December 7, 2025
**Status**: Production Ready ✅
