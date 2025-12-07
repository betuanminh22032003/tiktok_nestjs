import { MetricsService } from '@app/common/logging';
import { Controller, Get } from '@nestjs/common';

@Controller('metrics')
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @Get()
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
}
