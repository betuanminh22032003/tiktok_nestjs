// ==============================================================================
// METRICS CONTROLLER — Endpoint cho Prometheus scrape
// ==============================================================================
// Controller này expose GET /metrics endpoint.
//
// LUỒNG:
//   Prometheus (mỗi 10-15s) → GET http://service:port/metrics
//     → MetricsController.getMetrics()
//     → MetricsService.getMetrics()
//     → prom-client serialize tất cả metrics thành text
//     → Trả về response với Content-Type: text/plain
//     → Prometheus parse và lưu vào TSDB
//
// Response dạng:
//   # HELP http_requests_total Total number of HTTP requests
//   # TYPE http_requests_total counter
//   http_requests_total{method="GET",route="/api/users",status_code="200"} 1523
//   # HELP process_resident_memory_bytes Resident memory size in bytes
//   # TYPE process_resident_memory_bytes gauge
//   process_resident_memory_bytes 52428800
// ==============================================================================

import { Controller, Get, Header } from '@nestjs/common';
import { MetricsService } from './metrics.service';

@Controller('metrics')
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @Get()
  @Header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
  async getMetrics(): Promise<string> {
    // Lấy tất cả metrics từ registry và serialize thành text format
    return this.metricsService.getMetrics();
  }
}
