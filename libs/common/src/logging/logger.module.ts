// ==============================================================================
// LOGGER MODULE
// ==============================================================================
// NestJS module gom tất cả providers liên quan đến logging & metrics.
//
// Cách dùng: import LoggerModule vào module của service
//   @Module({ imports: [LoggerModule] })
//   export class AppModule {}
//
// Sau khi import, bạn có thể inject:
//   - CustomLoggerService → để ghi log
//   - MetricsService      → để ghi metrics
//
// Module này cũng đăng ký MetricsController → expose GET /metrics
// để Prometheus scrape metrics từ service.
// ==============================================================================

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggingInterceptor } from './logger.interceptor';
import { CustomLoggerService } from './logger.service';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

@Module({
  imports: [ConfigModule],
  controllers: [MetricsController], // Expose GET /metrics endpoint
  providers: [
    CustomLoggerService, // Winston logger
    MetricsService, // Prometheus metrics
    LoggingInterceptor, // Auto-log HTTP requests
  ],
  exports: [
    CustomLoggerService, // Cho phép service khác inject logger
    MetricsService, // Cho phép service khác ghi metrics
    LoggingInterceptor, // Cho phép đăng ký interceptor
  ],
})
export class LoggerModule {}
