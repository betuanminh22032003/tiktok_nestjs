import { Injectable } from '@nestjs/common';
import { collectDefaultMetrics, Counter, Gauge, Histogram, Registry } from 'prom-client';

@Injectable()
export class MetricsService {
  private httpRequestDuration: Histogram;
  private httpRequestTotal: Counter;
  private httpRequestErrors: Counter;
  private activeConnections: Gauge;
  private databaseQueryDuration: Histogram;
  private cacheHits: Counter;
  private cacheMisses: Counter;
  private messageQueueSize: Gauge;
  private registryInstance: Registry;

  constructor() {
    this.registryInstance = new Registry();
    collectDefaultMetrics({ register: this.registryInstance });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5],
      registers: [this.registryInstance],
    });

    this.httpRequestTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.registryInstance],
    });

    this.httpRequestErrors = new Counter({
      name: 'http_request_errors_total',
      help: 'Total number of HTTP request errors',
      labelNames: ['method', 'route', 'error_code'],
      registers: [this.registryInstance],
    });

    this.activeConnections = new Gauge({
      name: 'active_connections',
      help: 'Number of active connections',
      labelNames: ['type'],
      registers: [this.registryInstance],
    });

    this.databaseQueryDuration = new Histogram({
      name: 'database_query_duration_seconds',
      help: 'Duration of database queries',
      labelNames: ['operation', 'table'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1],
      registers: [this.registryInstance],
    });

    this.cacheHits = new Counter({
      name: 'cache_hits_total',
      help: 'Total cache hits',
      labelNames: ['cache_type'],
      registers: [this.registryInstance],
    });

    this.cacheMisses = new Counter({
      name: 'cache_misses_total',
      help: 'Total cache misses',
      labelNames: ['cache_type'],
      registers: [this.registryInstance],
    });

    this.messageQueueSize = new Gauge({
      name: 'message_queue_size',
      help: 'Current size of message queue',
      labelNames: ['queue_name'],
      registers: [this.registryInstance],
    });
  }

  recordHttpRequest(method: string, route: string, statusCode: number, duration: number): void {
    this.httpRequestTotal.inc({
      method,
      route,
      status_code: statusCode,
    });

    this.httpRequestDuration.observe(
      {
        method,
        route,
        status_code: statusCode,
      },
      duration / 1000, // Convert ms to seconds
    );

    if (statusCode >= 400) {
      this.httpRequestErrors.inc({
        method,
        route,
        error_code: statusCode,
      });
    }
  }

  setActiveConnections(type: string, count: number): void {
    this.activeConnections.set({ type }, count);
  }

  recordDatabaseQuery(operation: string, table: string, duration: number): void {
    this.databaseQueryDuration.observe({ operation, table }, duration / 1000);
  }

  recordCacheHit(cacheType: string): void {
    this.cacheHits.inc({ cache_type: cacheType });
  }

  recordCacheMiss(cacheType: string): void {
    this.cacheMisses.inc({ cache_type: cacheType });
  }

  setMessageQueueSize(queueName: string, size: number): void {
    this.messageQueueSize.set({ queue_name: queueName }, size);
  }

  async getMetrics(): Promise<string> {
    return this.registryInstance.metrics();
  }

  getRegistry(): Registry {
    return this.registryInstance;
  }
}
