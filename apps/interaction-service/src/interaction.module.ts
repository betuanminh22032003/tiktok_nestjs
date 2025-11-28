import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InteractionController } from './interaction.controller';
import { InteractionService } from './interaction.service';
import { InteractionDbModule } from '@app/interaction-db';
import { RedisModule } from '@app/redis';
import { KafkaModule } from '@app/kafka';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    InteractionDbModule,
    RedisModule,
    KafkaModule.register({ name: 'interaction-service' }),
  ],
  controllers: [InteractionController, HealthController],
  providers: [InteractionService],
})
export class InteractionModule {}
