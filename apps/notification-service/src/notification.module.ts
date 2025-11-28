import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationDbModule } from '@app/notification-db';
import { KafkaModule } from '@app/kafka';
import { HealthController } from './health.controller';
import { KafkaService } from '@app/kafka';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    NotificationDbModule,
    KafkaModule.register({ name: 'notification-service' }),
  ],
  controllers: [NotificationController, HealthController],
  providers: [NotificationService],
})
export class NotificationModule implements OnModuleInit {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly kafkaService: KafkaService,
  ) {}

  async onModuleInit() {
    // Subscribe to Kafka topics
    await this.kafkaService.subscribe('video.liked', async (data) => {
      await this.notificationService.handleVideoLiked(data as any);
    });

    await this.kafkaService.subscribe('comment.created', async (data) => {
      await this.notificationService.handleCommentCreated(data as any);
    });

    await this.kafkaService.subscribe('video.created', async (data) => {
      await this.notificationService.handleVideoCreated(data as any);
    });
  }
}
