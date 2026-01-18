import { CustomLoggerService, MetricsService } from '@app/common/logging';
import { Injectable } from '@nestjs/common';

/**
 * Example service showing how to use the monitoring & logging stack
 * Logs are collected by ECK (Elasticsearch) + Kibana for analysis
 */
@Injectable()
export class ExampleMonitoringService {
  constructor(
    private logger: CustomLoggerService,
    private metrics: MetricsService,
  ) {
    this.logger.setContext('ExampleMonitoringService');
  }

  /**
   * Example 1: Basic logging
   */
  exampleBasicLogging() {
    // Info level
    this.logger.log('Operation started', {
      operationId: 'op-123',
      userId: 'user-456',
    });

    // Debug level
    this.logger.debug('Detailed debug info', {
      step: 1,
      data: { key: 'value' },
    });

    // Warning level
    this.logger.warn('Performance degradation detected', {
      responseTime: 5000,
      threshold: 1000,
    });

    // Error level
    this.logger.error('Operation failed', new Error('Something went wrong'), {
      operationId: 'op-123',
      severity: 'high',
    });
  }

  /**
   * Example 2: Metrics recording
   */
  exampleMetrics() {
    // Record HTTP request
    this.metrics.recordHttpRequest('POST', '/api/users', 201, 245);

    // Record database query
    this.metrics.recordDatabaseQuery('SELECT', 'users', 150);

    // Record cache hits/misses
    this.metrics.recordCacheHit('redis');
    this.metrics.recordCacheMiss('redis');

    // Set active connections
    this.metrics.setActiveConnections('websocket', 42);

    // Set message queue size
    this.metrics.setMessageQueueSize('kafka-events', 156);
  }

  /**
   * Example 3: Error tracking (logs to Elasticsearch via Kibana)
   */
  async exampleErrorTracking() {
    try {
      // Your code that might fail
      throw new Error('Database connection failed');
    } catch (error) {
      // Log error - will be captured by Elasticsearch
      this.logger.error('Unrecoverable error', error, {
        context: 'user_registration',
        operation: 'user_registration',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Example 4: Database operation monitoring
   */
  async exampleDatabaseMonitoring() {
    const startTime = Date.now();

    try {
      // Your database query
      // const users = await userRepository.find();

      const duration = Date.now() - startTime;
      this.metrics.recordDatabaseQuery('SELECT', 'users', duration);

      this.logger.log('User query completed', {
        duration,
        count: 100, // number of results
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metrics.recordDatabaseQuery('SELECT', 'users', duration);

      this.logger.error('User query failed', error, {
        duration,
      });
    }
  }

  /**
   * Example 5: Cache operation monitoring
   */
  async exampleCacheMonitoring(cacheKey: string) {
    // Try to get from cache
    const cachedValue = null; // await redis.get(cacheKey);

    if (cachedValue) {
      this.metrics.recordCacheHit('redis');
      this.logger.debug('Cache hit', { key: cacheKey });
      return cachedValue;
    }

    this.metrics.recordCacheMiss('redis');
    this.logger.debug('Cache miss', { key: cacheKey });

    // Fetch from source and cache
    // const value = await this.getValueFromSource();
    // await redis.set(cacheKey, value);
    // return value;
  }

  private async processData() {
    // Simulate data processing
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}
