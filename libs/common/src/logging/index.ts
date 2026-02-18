// ==============================================================================
// LOGGING LIBRARY - Barrel exports
// ==============================================================================
// Đây là entry point của logging library.
// Export tất cả thành phần cần thiết cho monitoring:
//
// 1. LoggerModule      → NestJS module, import vào service module
// 2. CustomLoggerService → Winston logger, dùng để ghi log
// 3. MetricsService     → prom-client, dùng để tạo/ghi metrics
// 4. MetricsController  → Expose GET /metrics cho Prometheus scrape
// 5. LoggingInterceptor → Tự động ghi log + metrics cho mỗi HTTP request
// ==============================================================================

export * from './logger.interceptor';
export * from './logger.module';
export * from './logger.service';
export * from './metrics.controller';
export * from './metrics.service';
