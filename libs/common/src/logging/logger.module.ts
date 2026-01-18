import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpLoggingMiddleware } from './http-logging.middleware';
import { LoggingInterceptor } from './logger.interceptor';
import { CustomLoggerService } from './logger.service';
import { MetricsController } from './metrics.controller';
import { MetricsService } from './metrics.service';

@Module({
  imports: [ConfigModule],
  controllers: [MetricsController],
  providers: [CustomLoggerService, MetricsService, LoggingInterceptor, HttpLoggingMiddleware],
  exports: [CustomLoggerService, MetricsService, LoggingInterceptor, HttpLoggingMiddleware],
})
export class LoggerModule {}
