// ==============================================================================
// OPENTELEMETRY TRACING SETUP
// ==============================================================================
// File này khởi tạo OpenTelemetry SDK để tạo và gửi traces tới Tempo.
//
// *** QUAN TRỌNG: File này PHẢI được import TRƯỚC TẤT CẢ các module khác ***
// Vì OpenTelemetry cần monkey-patch các thư viện (http, express, pg, ioredis...)
// TRƯỚC khi chúng được load.
//
// CÁCH DÙNG: Thêm vào dòng đầu tiên của main.ts:
//   import './tracing';   // ← PHẢI ở dòng đầu tiên!
//   import { NestFactory } from '@nestjs/core';
//   ...
//
// LUỒNG TRACING:
//   1. OpenTelemetry SDK tự động tạo spans cho:
//      - HTTP requests (incoming + outgoing)
//      - gRPC calls
//      - Database queries (PostgreSQL qua pg driver)
//      - Redis commands (qua ioredis)
//
//   2. Mỗi span chứa: service name, operation, duration, status, attributes
//
//   3. SDK gửi spans tới Tempo qua OTLP HTTP protocol:
//      NestJS → http://tempo:4318/v1/traces → Tempo lưu trữ
//
//   4. Grafana query từ Tempo để hiển thị trace timeline
//
// VÍ DỤ TRACE:
//   [Trace ID: abc123]
//   ├── GET /api/videos (api-gateway, 120ms)
//   │   ├── AuthGuard.canActivate (5ms)
//   │   ├── gRPC VideoService.GetVideos (80ms)
//   │   │   ├── SELECT * FROM videos (PostgreSQL, 15ms)
//   │   │   └── GET video:cache (Redis, 2ms)
//   │   └── Response serialization (3ms)
// ==============================================================================

import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

// --- Tên service (lấy từ env hoặc default) ---
// Mỗi service cần có tên riêng để phân biệt trong trace timeline.
// Ví dụ: "api-gateway", "auth-service", "video-service"
const serviceName = process.env.OTEL_SERVICE_NAME || 'nestjs-app';

// --- Debug logging (chỉ bật khi cần troubleshoot) ---
if (process.env.OTEL_DEBUG === 'true') {
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);
}

// ==============================================================================
// EXPORTER: Nơi gửi traces tới
// ==============================================================================
// OTLPTraceExporter gửi traces tới Tempo qua HTTP POST.
// URL mặc định: http://localhost:4318/v1/traces (OTLP HTTP endpoint)
//
// OTEL_EXPORTER_OTLP_ENDPOINT chỉ cần set base URL (không cần /v1/traces)
// vì OTLPTraceExporter tự thêm path /v1/traces.
//
// Khi chạy local (không Docker): http://localhost:4318
// Khi chạy trong Docker: http://tempo:4318
// ==============================================================================
const exporterEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';

const traceExporter = new OTLPTraceExporter({
  url: `${exporterEndpoint}/v1/traces`,
});

// ==============================================================================
// SDK CONFIGURATION
// ==============================================================================
const sdk = new NodeSDK({
  // --- Resource: Metadata gắn vào mọi span ---
  // Giúp Grafana phân biệt traces từ service nào.
  // resourceFromAttributes() tạo Resource từ key-value attributes.
  // (Từ @opentelemetry/resources v2.x, dùng resourceFromAttributes thay cho new Resource)
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: serviceName,
    [ATTR_SERVICE_VERSION]: '1.0.0',
  }),

  // --- Span Processor: Cách xử lý spans trước khi gửi ---
  // BatchSpanProcessor: Gom nhiều spans lại, gửi theo batch (hiệu quả hơn)
  // Thay vì gửi từng span riêng lẻ → giảm network overhead
  spanProcessors: [new BatchSpanProcessor(traceExporter)],

  // --- Auto Instrumentations: Tự động tạo spans ---
  // Monkey-patch các thư viện phổ biến để tự động track operations:
  //
  // @opentelemetry/instrumentation-http      → HTTP requests (Express)
  // @opentelemetry/instrumentation-express   → Express middleware/routes
  // @opentelemetry/instrumentation-pg        → PostgreSQL queries
  // @opentelemetry/instrumentation-ioredis   → Redis commands
  // @opentelemetry/instrumentation-grpc      → gRPC calls
  //
  // Khi bạn gọi db.query("SELECT * FROM users"), instrumentation tự động
  // tạo một span ghi lại: operation=SELECT, table=users, duration=15ms
  instrumentations: [
    getNodeAutoInstrumentations({
      // Tắt instrumentation cho fs (file system) → quá nhiều noise
      '@opentelemetry/instrumentation-fs': { enabled: false },
      // Tắt DNS → không cần thiết
      '@opentelemetry/instrumentation-dns': { enabled: false },
      // Tắt net → quá low-level
      '@opentelemetry/instrumentation-net': { enabled: false },
    }),
  ],
});

// ==============================================================================
// KHỞI ĐỘNG SDK
// ==============================================================================
// sdk.start() PHẢI được gọi TRƯỚC khi NestJS bootstrap.
// Nó sẽ monkey-patch http, express, pg, ioredis... để tự động tạo spans.
// ==============================================================================
sdk.start();

// eslint-disable-next-line no-console
console.log(`[OpenTelemetry] Tracing initialized for service: ${serviceName}`);

// --- Graceful shutdown ---
// Khi process bị kill (SIGTERM), flush tất cả spans đang pending
// để không mất traces.
process.on('SIGTERM', () => {
  sdk.shutdown().then(
    // eslint-disable-next-line no-console
    () => console.log('[OpenTelemetry] SDK shut down successfully'),
    // eslint-disable-next-line no-console
    (err) => console.error('[OpenTelemetry] Error shutting down SDK', err),
  );
});
