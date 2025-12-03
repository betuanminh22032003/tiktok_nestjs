import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppVersion } from './entities/app-version.entity';
import { Comment } from './entities/comment.entity';
import { Like } from './entities/like.entity';
import { User } from './entities/user.entity';
import { Video } from './entities/video.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_NAME'),
        entities: [User, Video, Like, Comment, AppVersion],
        // Use migrations in production, synchronize in development
        synchronize:
          configService.get('NODE_ENV') === 'development' &&
          configService.get('DB_SYNC', 'false') === 'true',
        migrationsRun: configService.get('NODE_ENV') === 'production',
        logging: configService.get('NODE_ENV') === 'development',
        autoLoadEntities: true,
        // Connection pooling for performance
        extra: {
          max: 20, // Maximum number of clients in the pool
          min: 5, // Minimum number of clients in the pool
          idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
          connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection not established
          statement_timeout: 10000, // Query timeout 10 seconds
        },
        // Query optimization
        cache: {
          duration: 60000, // Cache queries for 1 minute
          type: 'database',
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
