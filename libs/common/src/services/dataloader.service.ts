import { Injectable, Logger } from '@nestjs/common';

interface BatchRequest {
  id: string;
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}

/**
 * DataLoader pattern for batching and caching gRPC requests
 * Reduces number of microservice calls
 */
@Injectable()
export class DataLoaderService {
  private readonly logger = new Logger(DataLoaderService.name);
  private readonly queues = new Map<string, BatchRequest[]>();
  private readonly timers = new Map<string, NodeJS.Timeout>();
  private readonly cache = new Map<string, { data: any; expiry: number }>();

  private readonly BATCH_DELAY = 10; // milliseconds
  private readonly CACHE_TTL = 60000; // 1 minute

  /**
   * Load data with automatic batching and caching
   */
  async load<T>(key: string, id: string, loader: (ids: string[]) => Promise<T[]>): Promise<T> {
    const cacheKey = `${key}:${id}`;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    return new Promise((resolve, reject) => {
      // Get or create queue for this key
      if (!this.queues.has(key)) {
        this.queues.set(key, []);
      }

      const queue = this.queues.get(key)!;
      queue.push({ id, resolve, reject });

      // Clear existing timer
      if (this.timers.has(key)) {
        clearTimeout(this.timers.get(key)!);
      }

      // Set new timer to batch requests
      const timer = setTimeout(async () => {
        const requests = queue.splice(0, queue.length);
        const ids = requests.map((r) => r.id);

        try {
          const results = await loader(ids);

          // Resolve all requests and cache results
          requests.forEach((request, index) => {
            const result = results[index];
            const cacheKey = `${key}:${request.id}`;

            // Cache the result
            this.cache.set(cacheKey, {
              data: result,
              expiry: Date.now() + this.CACHE_TTL,
            });

            request.resolve(result);
          });
        } catch (error) {
          this.logger.error(`Batch load error for key ${key}:`, error);
          requests.forEach((request) => request.reject(error));
        }

        this.timers.delete(key);
      }, this.BATCH_DELAY);

      this.timers.set(key, timer);
    });
  }

  /**
   * Clear cache for a specific key or all keys
   */
  clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * Prime cache with data
   */
  prime(key: string, id: string, data: any): void {
    const cacheKey = `${key}:${id}`;
    this.cache.set(cacheKey, {
      data,
      expiry: Date.now() + this.CACHE_TTL,
    });
  }
}
