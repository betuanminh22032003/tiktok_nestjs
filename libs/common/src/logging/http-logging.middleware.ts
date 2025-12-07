import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { CustomLoggerService } from './logger.service';

@Injectable()
export class HttpLoggingMiddleware implements NestMiddleware {
  constructor(private loggerService: CustomLoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const { method, url, headers, body } = req;

    // Log request
    this.loggerService.debug('Incoming Request', {
      method,
      url,
      headers: {
        'content-type': headers['content-type'],
        authorization: headers.authorization ? '***' : undefined,
      },
      bodySize: JSON.stringify(body).length,
    });

    // Intercept response
    const originalSend = res.send;
    res.send = function (data: any) {
      const duration = Date.now() - startTime;

      this.loggerService.debug('Outgoing Response', {
        method,
        url,
        statusCode: res.statusCode,
        duration,
        responseSize: data ? JSON.stringify(data).length : 0,
      });

      return originalSend.call(this, data);
    };

    next();
  }
}
