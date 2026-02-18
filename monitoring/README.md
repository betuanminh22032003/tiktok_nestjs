# Monitoring Stack: NestJS + Prometheus + Grafana + Loki + Tempo

## Kiến trúc tổng quan

Hệ thống monitoring gồm **3 trụ cột** (Three Pillars of Observability):

1. **Metrics** (Số liệu) — Prometheus → Grafana
2. **Logs** (Nhật ký) — Winston → Promtail → Loki → Grafana
3. **Traces** (Dấu vết phân tán) — OpenTelemetry → Tempo → Grafana

### 1. Luồng Metrics (Số liệu) — Prometheus

```
┌─────────────────────────────────────────────────────────────────────┐
│                        METRICS FLOW                                │
│                                                                     │
│  NestJS App (prom-client)                                          │
│    │                                                                │
│    ├── Tạo metrics: request count, duration, errors...             │
│    │                                                                │
│    └── Expose endpoint GET /metrics                                │
│         │         (dạng text/plain, format Prometheus)              │
│         │                                                           │
│         ▼                                                           │
│  Prometheus (port 9090)                                            │
│    │                                                                │
│    ├── Cứ mỗi 15s, Prometheus gọi GET /metrics tới mỗi service    │
│    ├── Lưu dữ liệu vào time-series database (TSDB)                │
│    │                                                                │
│    └── Grafana query từ Prometheus bằng PromQL                     │
│         │                                                           │
│         ▼                                                           │
│  Grafana (port 3005)                                               │
│    └── Hiển thị dashboard: biểu đồ, gauge, table...               │
└─────────────────────────────────────────────────────────────────────┘
```

### 2. Luồng Logs (Nhật ký) — Loki

```
┌─────────────────────────────────────────────────────────────────────┐
│                         LOG FLOW                                    │
│                                                                     │
│  NestJS App (Winston logger)                                       │
│    │                                                                │
│    ├── Ghi log ra Console (stdout) dạng JSON                       │
│    │     → Docker capture stdout thành container logs              │
│    │                                                                │
│    └── Ghi log ra File (/logs/*.log) dạng JSON                     │
│                                                                     │
│         │                                                           │
│         ▼                                                           │
│  Promtail (log collector)                                          │
│    │                                                                │
│    ├── Đọc Docker container logs (qua /var/lib/docker/containers)  │
│    ├── Đọc log files (qua /logs/*.log)                             │
│    ├── Gắn labels: service name, level, container...               │
│    │                                                                │
│    └── Push logs tới Loki                                          │
│         │                                                           │
│         ▼                                                           │
│  Loki (port 3100)                                                  │
│    │                                                                │
│    ├── Nhận logs từ Promtail                                       │
│    ├── Index theo labels (KHÔNG index nội dung log)                │
│    ├── Lưu trữ compressed chunks                                  │
│    │                                                                │
│    └── Grafana query từ Loki bằng LogQL                            │
│         │                                                           │
│         ▼                                                           │
│  Grafana (port 3005)                                               │
│    └── Hiển thị logs: search, filter by label, live tail...        │
└─────────────────────────────────────────────────────────────────────┘
```

### 3. Luồng Traces (Dấu vết phân tán) — Tempo

```
┌─────────────────────────────────────────────────────────────────────┐
│                        TRACE FLOW                                   │
│                                                                     │
│  NestJS App (OpenTelemetry SDK)                                    │
│    │                                                                │
│    ├── SDK được khởi tạo ĐẦU TIÊN trong main.ts                   │
│    │   (trước tất cả import khác để monkey-patch http, grpc...)    │
│    │                                                                │
│    ├── Tự động tạo spans cho:                                      │
│    │   • HTTP requests (incoming + outgoing)                       │
│    │   • gRPC calls (giữa các microservices)                       │
│    │   • PostgreSQL queries                                        │
│    │   • Redis commands                                            │
│    │                                                                │
│    ├── Mỗi request có 1 Trace ID duy nhất                         │
│    │   → Theo dõi request xuyên suốt nhiều services               │
│    │                                                                │
│    └── Gửi traces qua OTLP HTTP (port 4318)                       │
│         │                                                           │
│         ▼                                                           │
│  Tempo (port 3200)                                                 │
│    │                                                                │
│    ├── Nhận traces từ OpenTelemetry qua OTLP                      │
│    ├── Lưu trữ traces (local filesystem / S3)                     │
│    ├── Tạo service graph metrics → push về Prometheus              │
│    │                                                                │
│    └── Grafana query từ Tempo bằng TraceQL                         │
│         │                                                           │
│         ▼                                                           │
│  Grafana (port 3005)                                               │
│    ├── Xem trace timeline (waterfall view)                         │
│    ├── Nhảy từ log → trace (qua Trace ID)                         │
│    └── Nhảy từ trace → log (qua thời gian + service)              │
└─────────────────────────────────────────────────────────────────────┘
```

### Cách 3 trụ cột liên kết với nhau

```
┌─────────────────────────────────────────────────────────────────────┐
│                   CORRELATION (Liên kết)                            │
│                                                                     │
│  Request đến API Gateway                                           │
│    │                                                                │
│    ├── [METRICS] Tăng counter http_request_total                   │
│    ├── [LOG]     Ghi log "POST /api/auth/login"                    │
│    └── [TRACE]   Tạo trace với Trace ID: abc123                    │
│         │                                                           │
│         ├── Span 1: api-gateway xử lý HTTP                        │
│         ├── Span 2: gRPC call → auth-service                      │
│         ├── Span 3: auth-service query PostgreSQL                  │
│         └── Span 4: auth-service query Redis (cache)               │
│                                                                     │
│  Trong Grafana:                                                    │
│    • Thấy latency cao trong metrics → tìm trace tương ứng         │
│    • Thấy error trong logs → nhảy tới trace để xem call chain     │
│    • Thấy slow span trong trace → xem log chi tiết của span đó   │
└─────────────────────────────────────────────────────────────────────┘
```

## Các services và ports

| Service    | Port | Mô tả                                    |
| ---------- | ---- | ---------------------------------------- |
| Prometheus | 9090 | Thu thập & lưu metrics                   |
| Grafana    | 3005 | Dashboard UI (admin/admin123)            |
| Loki       | 3100 | Lưu trữ logs (giống Prometheus cho logs) |
| Promtail   | —    | Thu thập logs, push tới Loki             |
| Tempo      | 3200 | Lưu trữ traces (API port)                |
| Tempo OTLP | 4318 | Nhận traces từ OpenTelemetry (OTLP HTTP) |

## Cách truy cập

- **Grafana**: http://localhost:3005 (user: `admin`, pass: `admin123`)
- **Prometheus**: http://localhost:9090 (query metrics trực tiếp)
- **Loki**: http://localhost:3100 (API only, dùng qua Grafana)
- **Tempo**: http://localhost:3200 (API only, dùng qua Grafana → Explore → Tempo)

## Cấu trúc file

```
monitoring/
├── README.md                               ← File này
├── prometheus.yml                          ← Cấu hình Prometheus: scrape targets
├── loki-config.yml                         ← Cấu hình Loki: storage, retention
├── promtail-config.yml                     ← Cấu hình Promtail: đọc logs từ đâu
├── tempo-config.yml                        ← Cấu hình Tempo: nhận traces, lưu trữ
└── grafana/
    ├── provisioning/
    │   ├── datasources/
    │   │   └── datasources.yml             ← Auto-config datasources (Prometheus, Loki, Tempo)
    │   └── dashboards/
    │       └── dashboards.yml              ← Auto-load dashboards cho Grafana
    └── dashboards/
        └── nestjs-overview.json            ← Dashboard mẫu

libs/common/src/
├── logging/                                ← Thư viện logging & metrics
│   ├── index.ts                            ← Barrel exports
│   ├── logger.module.ts                    ← NestJS Module (import vào AppModule)
│   ├── logger.service.ts                   ← Winston logger (ghi log JSON)
│   ├── logger.interceptor.ts               ← Auto-log mỗi HTTP request + record metrics
│   ├── metrics.service.ts                  ← Prometheus metrics (prom-client)
│   └── metrics.controller.ts               ← GET /metrics endpoint
└── tracing/                                ← Thư viện distributed tracing
    ├── index.ts                            ← Barrel import (trigger side-effect)
    └── tracing.ts                          ← OpenTelemetry SDK setup (khởi tạo trước tiên)
```

## Cách sử dụng Tracing trong Grafana

### Xem traces

1. Mở Grafana → **Explore** (biểu tượng la bàn bên trái)
2. Chọn datasource **Tempo**
3. Chọn tab **Search** → chọn Service Name → Run query
4. Click vào 1 trace để xem waterfall timeline

### Nhảy từ Log → Trace

1. Trong Grafana Explore, chọn datasource **Loki**
2. Query logs: `{service_name="api-gateway"}`
3. Nếu log có chứa Trace ID, click vào link để nhảy sang Tempo

### Nhảy từ Trace → Log

1. Khi đang xem 1 trace trong Tempo
2. Click vào 1 span → chọn **Logs for this span**
3. Grafana tự động query Loki với khoảng thời gian và service tương ứng
