import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { WebsocketModule } from '../websocket/websocket.module';
import { InteractionController } from './interaction.controller';

@Module({
  imports: [
    WebsocketModule,
    ClientsModule.register([
      {
        name: 'INTERACTION_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'interaction',
          protoPath: join(process.cwd(), 'proto', 'interaction.proto'),
          url: process.env.GRPC_INTERACTION_URL || 'localhost:50053',
        },
      },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_ACCESS_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [InteractionController],
})
export class InteractionModule {}
