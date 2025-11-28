import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken, User } from './entities';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('AUTH_DB_HOST', 'localhost'),
        port: configService.get('AUTH_DB_PORT', 5432),
        username: configService.get('AUTH_DB_USERNAME', 'postgres'),
        password: configService.get('AUTH_DB_PASSWORD', 'postgres'),
        database: configService.get('AUTH_DB_NAME', 'tiktok_auth'),
        entities: [User, RefreshToken],
        synchronize:
          configService.get('NODE_ENV') === 'development' &&
          configService.get('AUTH_DB_SYNC', 'false') === 'true',
        migrationsRun: configService.get('NODE_ENV') === 'production',
        logging: configService.get('NODE_ENV') === 'development',
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, RefreshToken]),
  ],
  exports: [TypeOrmModule],
})
export class AuthDbModule {}
