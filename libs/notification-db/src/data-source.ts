import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Notification, NotificationDelivery, NotificationPreference } from './entities';

export const createNotificationDataSource = (configService: ConfigService) => {
  return new DataSource({
    type: 'postgres',
    host: configService.get('NOTIFICATION_DB_HOST', 'localhost'),
    port: configService.get('NOTIFICATION_DB_PORT', 5435),
    username: configService.get('NOTIFICATION_DB_USERNAME', 'postgres'),
    password: configService.get('NOTIFICATION_DB_PASSWORD', 'postgres'),
    database: configService.get('NOTIFICATION_DB_NAME', 'tiktok_notification'),
    entities: [Notification, NotificationDelivery, NotificationPreference],
    migrations: [__dirname + '/migrations/*{.ts,.js}'],
    synchronize: false,
    logging: configService.get('NODE_ENV') === 'development',
  });
};
