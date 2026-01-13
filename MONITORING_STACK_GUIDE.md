# 📊 TikTok Clone - Complete Monitoring Stack

## 🎉 What's Included

Your deployment now includes a **production-grade monitoring stack**!

### Monitoring Components

| Component         | Purpose                      | Port | URL (after deployment) |
| ----------------- | ---------------------------- | ---- | ---------------------- |
| **Prometheus**    | Metrics collection & storage | 9090 | http://localhost:9090  |
| **Grafana**       | Dashboards & visualization   | 3000 | http://localhost:3000  |
| **Elasticsearch** | Log storage & search         | 9200 | http://localhost:9200  |
| **Kibana**        | Log analysis UI              | 5601 | http://localhost:5601  |
| **AlertManager**  | Alert routing & management   | 9093 | http://localhost:9093  |
| **Loki**          | Log aggregation (Grafana)    | 3100 | http://localhost:3100  |
| **Promtail**      | Log shipper                  | -    | DaemonSet              |

---

## 🚀 Quick Start

### Deploy Everything

```powershell
# Deploy with monitoring enabled (default)
.\scripts\deploy-k8s-local.ps1 -Action install -Environment dev

# Check status
.\scripts\deploy-k8s-local.ps1 -Action status
```

### Access Monitoring Services

```powershell
# Grafana (Dashboards)
kubectl port-forward svc/grafana 3000:3000 -n tiktok-clone
# Open: http://localhost:3000
# Login: admin / Grafana@Admin#2026!

# Prometheus (Metrics)
kubectl port-forward svc/prometheus 9090:9090 -n tiktok-clone
# Open: http://localhost:9090

# Kibana (Logs)
kubectl port-forward svc/kibana 5601:5601 -n tiktok-clone
# Open: http://localhost:5601

# AlertManager (Alerts)
kubectl port-forward svc/alertmanager 9093:9093 -n tiktok-clone
# Open: http://localhost:9093
```

---

## 📊 Grafana Setup

### First Time Login

1. **Access Grafana:**

   ```powershell
   kubectl port-forward svc/grafana 3000:3000 -n tiktok-clone
   ```

   Open: http://localhost:3000

2. **Login:**
   - Username: `admin`
   - Password: `Grafana@Admin#2026!`

3. **Verify Datasources:**
   - Go to Configuration → Data Sources
   - Should see: Prometheus, Loki, Elasticsearch (auto-configured)

### Quick Dashboards

**Create a Dashboard:**

1. Click **+** → **Dashboard** → **Add new panel**
2. Select **Prometheus** datasource
3. Try these queries:

```promql
# Request rate
rate(http_requests_total[5m])

# CPU usage
rate(process_cpu_seconds_total[5m])

# Memory usage
process_resident_memory_bytes / 1024 / 1024

# Error rate
rate(http_requests_total{status=~"5.."}[5m])

# Response time (95th percentile)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

**Import Pre-built Dashboards:**

1. Go to **Dashboards** → **Import**
2. Enter Dashboard ID:
   - **1860** - Node Exporter Full
   - **3662** - Prometheus 2.0 Stats
   - **7249** - Kubernetes Cluster Monitoring
   - **13639** - Loki Dashboard

---

## 🔔 AlertManager

### Pre-configured Alerts

The following alerts are automatically configured:

| Alert                      | Condition                    | Severity |
| -------------------------- | ---------------------------- | -------- |
| **ServiceDown**            | Service unavailable for 1min | Critical |
| **HighCPUUsage**           | CPU > 80% for 5min           | Warning  |
| **HighMemoryUsage**        | Memory > 500MB for 5min      | Warning  |
| **HighErrorRate**          | Errors > 5% for 5min         | Critical |
| **SlowResponseTime**       | p95 > 1s for 5min            | Warning  |
| **DatabaseConnectionPool** | Connections > 80             | Warning  |
| **RedisMemoryHigh**        | Memory > 90%                 | Warning  |
| **KafkaConsumerLag**       | Lag > 1000 messages          | Warning  |
| **PodRestartingTooOften**  | Restarts > 5/hour            | Warning  |

### View Active Alerts

```powershell
kubectl port-forward svc/alertmanager 9093:9093 -n tiktok-clone
```

Open: http://localhost:9093

### Test Alert

```powershell
# Stop a service to trigger ServiceDown alert
kubectl scale deployment auth-service --replicas=0 -n tiktok-clone

# Wait ~1 minute, check AlertManager

# Restore
kubectl scale deployment auth-service --replicas=2 -n tiktok-clone
```

---

## 📝 Elasticsearch & Kibana

### Access Logs

1. **Port forward Kibana:**

   ```powershell
   kubectl port-forward svc/kibana 5601:5601 -n tiktok-clone
   ```

2. **Open:** http://localhost:5601

3. **Create Index Pattern:**
   - Go to **Management** → **Stack Management** → **Index Patterns**
   - Click **Create index pattern**
   - Pattern: `logstash-*`
   - Time field: `@timestamp`
   - Click **Create**

4. **View Logs:**
   - Go to **Analytics** → **Discover**
   - Select `logstash-*` index
   - Filter by service, level, etc.

### Useful KQL Queries

```
# All errors
level: "error"

# Specific service
kubernetes.labels.app: "auth-service"

# Last 15 minutes
@timestamp >= now-15m

# Errors from API Gateway
level: "error" AND kubernetes.labels.app: "api-gateway"
```

---

## 🔍 Prometheus Queries

### Useful Queries

```promql
# Total requests per second
sum(rate(http_requests_total[5m])) by (service)

# Error rate percentage
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100

# Average response time
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])

# Top 5 slowest endpoints
topk(5, histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])))

# CPU usage by pod
sum(rate(container_cpu_usage_seconds_total[5m])) by (pod)

# Memory usage by pod
sum(container_memory_working_set_bytes) by (pod) / 1024 / 1024

# Pod restart count
kube_pod_container_status_restarts_total

# Available resources
kube_node_status_allocatable{resource="memory"} / 1024 / 1024 / 1024
```

---

## 🎯 Loki & Promtail

### View Logs in Grafana

1. **Access Grafana:** http://localhost:3000
2. **Go to Explore**
3. **Select Loki datasource**
4. **LogQL Examples:**

```logql
# All logs from auth-service
{app="auth-service"}

# Errors only
{app="auth-service"} |= "error"

# JSON parsing
{app="auth-service"} | json | level="error"

# Rate of errors
rate({app="auth-service"} |= "error" [5m])

# Top 10 error messages
topk(10, sum by (msg) (rate({app="auth-service"} |= "error" [5m])))
```

---

## ⚙️ Configuration

### Enable/Disable Components

Edit `helm/tiktok-clone/values.yaml`:

```yaml
monitoring:
  enabled: true # Master switch
  prometheus:
    enabled: true # Metrics
  grafana:
    enabled: true # Dashboards
  elasticsearch:
    enabled: true # Log storage + Kibana
  alertmanager:
    enabled: true # Alerts (requires Prometheus)
  loki:
    enabled: true # Log aggregation
  promtail:
    enabled: true # Log shipper (requires Loki)
```

**Deploy with monitoring disabled:**

```powershell
helm upgrade tiktok-clone ./helm/tiktok-clone \
  -n tiktok-clone \
  --set monitoring.enabled=false
```

### Resource Tuning

**For smaller environments (Docker Desktop with 4GB RAM):**

```yaml
monitoring:
  elasticsearch:
    enabled: false # Disable ES (uses 1GB+)
  loki:
    enabled: true # Use Loki instead (lighter)
```

**For production:**

```yaml
monitoring:
  prometheus:
    resources:
      requests:
        memory: '2Gi'
        cpu: '1000m'
  elasticsearch:
    resources:
      requests:
        memory: '4Gi'
        cpu: '2000m'
```

---

## 🐛 Troubleshooting

### Monitoring Pods Not Starting

```powershell
# Check pod status
kubectl get pods -n tiktok-clone | findstr "prometheus\|grafana\|elasticsearch"

# Check specific pod
kubectl describe pod prometheus-xxx -n tiktok-clone

# Check logs
kubectl logs prometheus-xxx -n tiktok-clone
```

### Elasticsearch Issues

**Issue:** Elasticsearch pod CrashLoopBackOff

**Solution:** vm.max_map_count too low

```powershell
# For Docker Desktop - this is handled by init container
# For Minikube:
minikube ssh "sudo sysctl -w vm.max_map_count=262144"
```

### Grafana Can't Connect to Datasources

```powershell
# Check service connectivity
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -n tiktok-clone -- sh
# Inside pod:
curl http://prometheus:9090/-/healthy
curl http://loki:3100/ready
curl http://elasticsearch:9200/_cluster/health
```

### No Metrics Showing

**Check Prometheus targets:**

```powershell
kubectl port-forward svc/prometheus 9090:9090 -n tiktok-clone
```

Open http://localhost:9090/targets

**Common issues:**

- Services don't expose metrics endpoint
- ServiceMonitor not configured
- Network policies blocking scraping

---

## 📈 Best Practices

### 1. Start Simple

```powershell
# First deployment: disable heavy components
monitoring:
  elasticsearch: false      # Heavy on resources
  loki: true               # Lightweight alternative
```

### 2. Use Loki for Logs

- Lighter than Elasticsearch
- Native Grafana integration
- Good for local development

### 3. Monitor the Monitors

- Set resource limits
- Watch monitoring stack resource usage
- Scale down if needed

### 4. Regular Maintenance

```powershell
# Check disk usage
kubectl exec -it prometheus-xxx -n tiktok-clone -- df -h /prometheus

# Clean old data if needed
kubectl exec -it prometheus-xxx -n tiktok-clone -- \
  rm -rf /prometheus/wal
```

---

## 🎓 Learning Resources

### Prometheus

- Docs: https://prometheus.io/docs/
- PromQL: https://prometheus.io/docs/prometheus/latest/querying/basics/

### Grafana

- Docs: https://grafana.com/docs/
- Dashboards: https://grafana.com/grafana/dashboards/

### Loki

- Docs: https://grafana.com/docs/loki/
- LogQL: https://grafana.com/docs/loki/latest/logql/

### Elasticsearch

- Docs: https://www.elastic.co/guide/
- KQL: https://www.elastic.co/guide/en/kibana/current/kuery-query.html

---

## 🔗 Quick Links

| Service          | Local Access                                                      |
| ---------------- | ----------------------------------------------------------------- |
| **Grafana**      | `kubectl port-forward svc/grafana 3000:3000 -n tiktok-clone`      |
| **Prometheus**   | `kubectl port-forward svc/prometheus 9090:9090 -n tiktok-clone`   |
| **Kibana**       | `kubectl port-forward svc/kibana 5601:5601 -n tiktok-clone`       |
| **AlertManager** | `kubectl port-forward svc/alertmanager 9093:9093 -n tiktok-clone` |

**Default Credentials:**

- Grafana: `admin` / `Grafana@Admin#2026!`
- Kibana: No auth (security disabled)

---

**Enjoy your complete monitoring stack! 🎉📊**
