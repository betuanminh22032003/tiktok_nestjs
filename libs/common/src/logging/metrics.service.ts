// ==============================================================================
// METRICS SERVICE (Prometheus - prom-client)
// ==============================================================================
// Service tạo và quản lý Prometheus metrics sử dụng thư viện prom-client.
//
// LUỒNG METRICS:
//   1. Code gọi metricsService.recordHttpRequest(...)
//   2. prom-client lưu giá trị vào memory (Registry)
//   3. Prometheus gọi GET /metrics mỗi 10-15s
//   4. MetricsController trả về metricsService.getMetrics() → text format
//   5. Prometheus parse và lưu vào TSDB
//   6. Grafana query Prometheus bằng PromQL để hiển thị dashboard
//
// CÁC LOẠI METRICS:
//   - Counter: Chỉ tăng (ví dụ: tổng số requests) → dùng rate() để xem tốc độ
//   - Histogram: Đo phân bố giá trị (ví dụ: request duration) → dùng histogram_quantile()
//   - Gauge: Tăng/giảm (ví dụ: số connections đang active)
//
// DEFAULT METRICS:
//   collectDefaultMetrics() tự động thu thập metrics của Node.js process:
//   - process_cpu_seconds_total      → CPU usage
//   - process_resident_memory_bytes  → Memory usage (RSS)
//   - nodejs_eventloop_lag_seconds   → Event loop lag
//   - nodejs_active_handles_total    → Active handles
//   - nodejs_heap_size_used_bytes    → V8 heap usage
// ==============================================================================

import { Injectable } from '@nestjs/common';
import { collectDefaultMetrics, Counter, Gauge, Histogram, Registry } from 'prom-client';

@Injectable()
export class MetricsService {
  // Registry chứa tất cả metrics. Khi gọi getMetrics(), nó serialize tất cả
  // metrics trong registry thành text format cho Prometheus.
  private registryInstance: Registry;

  // --- HTTP Metrics ---
  private httpRequestDuration: Histogram; // Đo thời gian xử lý request
  private httpRequestTotal: Counter; // Đếm tổng số requests
  private httpRequestErrors: Counter; // Đếm tổng số request errors

  // --- Application Metrics ---
  private activeConnections: Gauge; // Số connections đang active

  constructor() {
    // Tạo custom Registry (không dùng global default registry)
    this.registryInstance = new Registry();

    // =========================================================================
    // Default Node.js Metrics
    // =========================================================================
    // Tự động thu thập metrics về Node.js process.
    // Prometheus sẽ scrape các metrics này cùng lúc với custom metrics.
    // Ví dụ output:
    //   process_resident_memory_bytes 52428800
    //   nodejs_eventloop_lag_seconds 0.012
    //   process_cpu_seconds_total 45.23
    // =========================================================================
    collectDefaultMetrics({ register: this.registryInstance });

    // =========================================================================
    // Custom Metric 1: HTTP Request Duration (Histogram)
    // =========================================================================
    // Histogram chia giá trị vào các "buckets" (khoảng).
    // Khi request mất 0.3s → nó rơi vào bucket le="0.5"
    // Prometheus dùng histogram_quantile() để tính P50, P95, P99
    //
    // Output dạng:
    //   http_request_duration_seconds_bucket{method="GET",route="/api/users",le="0.1"} 980
    //   http_request_duration_seconds_bucket{method="GET",route="/api/users",le="0.5"} 1200
    //   http_request_duration_seconds_bucket{method="GET",route="/api/users",le="+Inf"} 1250
    // =========================================================================
    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      // Buckets: 10ms, 50ms, 100ms, 300ms, 500ms, 1s, 2s, 5s
      buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
      registers: [this.registryInstance],
    });

    // =========================================================================
    // Custom Metric 2: HTTP Request Total (Counter)
    // =========================================================================
    // Counter chỉ tăng, không giảm.
    // Để xem request rate (req/s), dùng PromQL: rate(http_requests_total[5m])
    //
    // Output dạng:
    //   http_requests_total{method="GET",route="/api/users",status_code="200"} 15234
    // =========================================================================
    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registryInstance],
    });

    // =========================================================================
    // Custom Metric 3: HTTP Request Errors (Counter)
    // =========================================================================
    // Đếm riêng error requests (status >= 400).
    // Error rate = rate(http_request_errors_total[5m]) / rate(http_requests_total[5m])
    // =========================================================================
    this.httpRequestErrors = new Counter({
      name: 'http_request_errors_total',
      help: 'Total number of HTTP request errors (status >= 400)',
      labelNames: ['method', 'route', 'error_code'],
      registers: [this.registryInstance],
    });

    // =========================================================================
    // Custom Metric 4: Active Connections (Gauge)
    // =========================================================================
    // Gauge có thể tăng/giảm → phù hợp cho giá trị hiện tại.
    // Ví dụ: số WebSocket connections đang mở.
    // =========================================================================
    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
      labelNames: ['type'],
      registers: [this.registryInstance],
    });
  }

  // ===========================================================================
  // PUBLIC METHODS — Gọi từ LoggingInterceptor hoặc service code
  // ===========================================================================

  /**
   * Ghi nhận một HTTP request hoàn thành.
   * Gọi trong LoggingInterceptor sau khi request xử lý xong.
   *
   * @param method    HTTP method (GET, POST, ...)
   * @param route     URL path (/api/users, /api/videos, ...)
   * @param statusCode HTTP status code (200, 404, 500, ...)
   * @param duration  Thời gian xử lý (milliseconds)
   */
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void {
    // Tăng counter: tổng số requests
    this.httpRequestTotal.inc({ method, route, status_code: statusCode });

    // Ghi vào histogram: thời gian xử lý (chuyển ms → seconds)
    this.httpRequestDuration.observe({ method, route, status_code: statusCode }, duration / 1000);

    // Nếu là error (status >= 400), tăng error counter
    if (statusCode >= 400) {
      this.httpRequestErrors.inc({ method, route, error_code: statusCode });
    }
  }

  /** Set số connections đang active (ví dụ: WebSocket connections) */
  setActiveConnections(type: string, count: number): void {
    this.activeConnections.set({ type }, count);
  }

  /**
   * Prometheus gọi endpoint GET /metrics, MetricsController gọi hàm này.
   * Trả về TẤT CẢ metrics trong registry dạng text Prometheus format.
   *
   * Ví dụ output:
   *   # HELP http_requests_total Total number of HTTP requests
   *   # TYPE http_requests_total counter
   *   http_requests_total{method="GET",route="/api/users",status_code="200"} 1523
   */
  async getMetrics(): Promise<string> {
    return this.registryInstance.metrics();
  }

  /** Lấy registry instance (dùng khi cần content-type header) */
  getRegistry(): Registry {
    return this.registryInstance;
  }
}
