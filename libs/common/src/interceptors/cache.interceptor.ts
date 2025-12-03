import { RedisService } from '@app/redis';
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  constructor(private readonly redisService: RedisService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;

    // Only cache GET requests
    if (method !== 'GET') {
      return next.handle();
    }

    const key = this.generateCacheKey(request);
    const cachedResponse = await this.redisService.get(key);

    if (cachedResponse) {
      return of(JSON.parse(cachedResponse));
    }

    return next.handle().pipe(
      tap(async (response) => {
        // Cache for 5 minutes by default
        await this.redisService.set(key, JSON.stringify(response), 300);
      }),
    );
  }

  private generateCacheKey(request: any): string {
    const url = request.url;
    const userId = request.user?.sub || 'anonymous';
    return `http:cache:${userId}:${url}`;
  }
}
