import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

// Các path không cần wrap response (ví dụ: /metrics trả text/plain cho Prometheus)
const EXCLUDED_PATHS = ['/metrics'];

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest();
    const url: string = request?.url || '';

    // Bỏ qua transform cho các path đặc biệt (Prometheus cần text/plain, không phải JSON)
    if (EXCLUDED_PATHS.some((path) => url.startsWith(path))) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        timestamp: new Date().toISOString(),
      })),
    );
  }
}
