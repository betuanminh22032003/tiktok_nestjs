import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User, RefreshToken } from '../entities';

const configService = new ConfigService();

export const AuthDataSource = new DataSource({
  type: 'postgres',
  host: configService.get('AUTH_DB_HOST', 'localhost'),
  port: configService.get('AUTH_DB_PORT', 5432),
  username: configService.get('AUTH_DB_USERNAME', 'postgres'),
  password: configService.get('AUTH_DB_PASSWORD', 'postgres'),
  database: configService.get('AUTH_DB_NAME', 'tiktok_auth'),
  entities: [User, RefreshToken],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: false,
  logging: false,
});