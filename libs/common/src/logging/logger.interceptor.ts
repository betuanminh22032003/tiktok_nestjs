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
      tap(() => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        this.metricsService.recordHttpRequest(method, url, statusCode, duration);

        this.loggerService.log('HTTP Request', {
          method,
          url,
          statusCode,
          duration,
          userAgent: headers['user-agent'],
          ip: request.ip,
        });
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode || 500;

        this.metricsService.recordHttpRequest(method, url, statusCode, duration);

        this.loggerService.error('HTTP Request Error', error, {
          method,
          url,
          statusCode,
          duration,
          userAgent: headers['user-agent'],
          ip: request.ip,
        });

        throw error;
      }),
    );
  }
}
