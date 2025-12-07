import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpLoggingMiddleware } from './http-logging.middleware';
import { LoggingInterceptor } from './logger.interceptor';
import { CustomLoggerService } from './logger.service';
import { MetricsService } from './metrics.service';
import { SentryService } from './sentry.service';

@Module({
  imports: [ConfigModule],
  providers: [
    CustomLoggerService,
    MetricsService,
    SentryService,
    LoggingInterceptor,
    HttpLoggingMiddleware,
  ],
  exports: [
    CustomLoggerService,
    MetricsService,
    SentryService,
    LoggingInterceptor,
    HttpLoggingMiddleware,
  ],
})
export class LoggerModule {}
