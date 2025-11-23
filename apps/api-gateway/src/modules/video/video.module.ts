import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { VideoController } from './video.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'VIDEO_SERVICE',
        transport: Transport.GRPC,
        options: {
          package: 'video',
          protoPath: join(process.cwd(), 'proto', 'video.proto'),
          url: process.env.GRPC_VIDEO_URL || 'localhost:50052',
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
  controllers: [VideoController],
})
export class VideoModule {}
