// ==============================================================================
// CUSTOM LOGGER SERVICE (Winston)
// ==============================================================================
// Service ghi log sử dụng Winston - thư viện logging phổ biến nhất cho Node.js.
//
// LUỒNG LOG:
//   Code gọi logger.log("message")
//     → Winston format thành JSON
//     → Ghi ra 2 nơi (transports):
//         1. Console (stdout) → Docker capture → Promtail → Loki → Grafana
//         2. File (/logs/*.log) → Promtail đọc → Loki → Grafana
//
// TẠI SAO GHI JSON?
//   Promtail cần parse log để extract labels (level, context, ...).
//   JSON dễ parse hơn text thuần. Grafana/Loki có thể filter theo field.
//
// LOG LEVELS (từ cao → thấp):
//   error > warn > info > debug > verbose
//   Nếu LOG_LEVEL=info → chỉ ghi error, warn, info (bỏ debug, verbose)
// ==============================================================================

import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

@Injectable()
export class CustomLoggerService implements LoggerService {
  private logger: winston.Logger;
  private context: string;

  constructor(private configService: ConfigService) {
    this.logger = this.createLogger();
  }

  private createLogger(): winston.Logger {
    const isProduction = this.configService.get('NODE_ENV') === 'production';
    const logLevel = this.configService.get('LOG_LEVEL', isProduction ? 'info' : 'debug');

    const transports: winston.transport[] = [];

    // =========================================================================
    // TRANSPORT 1: Console
    // =========================================================================
    // Ghi log ra stdout (terminal).
    // Khi chạy trong Docker, stdout được Docker daemon capture và lưu thành
    // container logs tại /var/lib/docker/containers/<id>/<id>-json.log
    // → Promtail đọc file này → push tới Loki → hiển thị trong Grafana
    //
    // Format JSON để Promtail dễ parse và extract labels.
    // =========================================================================
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.errors({ stack: true }),
          // Development: colorize + readable format
          // Production: JSON format cho Promtail parse
          ...(isProduction
            ? [winston.format.json()]
            : [
                winston.format.colorize(),
                winston.format.printf(({ level, message, timestamp, ...meta }) => {
                  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
                  return `[${timestamp}] [${level}]: ${message} ${metaStr}`;
                }),
              ]),
        ),
      }),
    );

    // =========================================================================
    // TRANSPORT 2: Daily Rotate File
    // =========================================================================
    // Ghi log ra file, tự động tạo file mới mỗi ngày.
    // File: /logs/application-2024-01-15.log
    //
    // Promtail cũng đọc thư mục /logs/*.log → push tới Loki
    // Đây là nguồn backup, đảm bảo logs không mất khi container restart.
    // =========================================================================
    transports.push(
      new DailyRotateFile({
        filename: 'logs/application-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m', // Rotate khi file > 20MB
        maxFiles: '14d', // Giữ logs 14 ngày, tự xóa cũ hơn
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.errors({ stack: true }),
          winston.format.json(), // Luôn ghi JSON cho dễ parse
        ),
      }),
    );

    // =========================================================================
    // TRANSPORT 3: Error-only File
    // =========================================================================
    // Ghi riêng error logs ra file separate → dễ tìm lỗi nhanh.
    // File: /logs/error-2024-01-15.log
    // =========================================================================
    transports.push(
      new DailyRotateFile({
        level: 'error', // Chỉ ghi log level error trở lên
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.errors({ stack: true }),
          winston.format.json(),
        ),
      }),
    );

    return winston.createLogger({
      level: logLevel,
      transports,
      // Nếu có exception/rejection không bắt được, cũng ghi vào log
      exceptionHandlers: transports,
      rejectionHandlers: transports,
    });
  }

  // --- Public API ---

  setContext(context: string): void {
    this.context = context;
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, { context: this.context, ...meta });
  }

  error(message: string, trace?: any, meta?: any): void {
    this.logger.error(message, { context: this.context, stack: trace, ...meta });
  }

  log(message: string, meta?: any): void {
    this.logger.info(message, { context: this.context, ...meta });
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, { context: this.context, ...meta });
  }

  verbose(message: string, meta?: any): void {
    this.logger.debug(message, { context: this.context, level: 'verbose', ...meta });
  }
}
