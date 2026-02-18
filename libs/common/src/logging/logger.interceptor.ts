// ==============================================================================
// LOGGING INTERCEPTOR (cho LoggerModule)
// ==============================================================================
// NestJS Interceptor chạy TRƯỚC và SAU mỗi HTTP request handler.
//
// LUỒNG:
//   HTTP Request vào
//     → Interceptor bắt đầu đo thời gian
//     → Controller handler xử lý request
//     → Interceptor nhận response/error
//     → Ghi metrics vào MetricsService (→ Prometheus scrape)
//     → Ghi log vào CustomLoggerService (→ Winston → Loki)
//
// Interceptor này được đăng ký trong LoggerModule. Khi service import
// LoggerModule và đăng ký interceptor, mọi HTTP request tự động được
// log và record metrics.
// ==============================================================================

import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { CustomLoggerService } from './logger.service';
import { MetricsService } from './metrics.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(
    private loggerService: CustomLoggerService,
    private metricsService: MetricsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();
    const { method, url, headers } = request;

    return next.handle().pipe(
      // --- Request thành công ---
      tap(() => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Ghi metrics → prom-client lưu vào memory → Prometheus scrape
        this.metricsService.recordHttpRequest(method, url, statusCode, duration);

        // Ghi log → Winston → Console + File → Promtail → Loki → Grafana
        this.loggerService.log('HTTP Request', {
          method,
          url,
          statusCode,
          duration,
          userAgent: headers['user-agent'],
          ip: request.ip,
        });
      }),

      // --- Request lỗi ---
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || response.statusCode || 500;

        // Ghi metrics lỗi
        this.metricsService.recordHttpRequest(method, url, statusCode, duration);

        // Ghi error log
        this.loggerService.error('HTTP Request Error', error.stack, {
          method,
          url,
          statusCode,
          duration,
          errorMessage: error.message,
          userAgent: headers['user-agent'],
          ip: request.ip,
        });

        throw error;
      }),
    );
  }
}
