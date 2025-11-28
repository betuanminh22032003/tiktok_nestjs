import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { VideoDbModule } from '@app/video-db';
import { RedisModule } from '@app/redis';
import { KafkaModule } from '@app/kafka';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    VideoDbModule,
    RedisModule,
    KafkaModule.register({ name: 'video-service' }),
  ],
  controllers: [VideoController, HealthController],
  providers: [VideoService],
})
export class VideoModule {}
