import { DataSource } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { NotificationDelivery } from '../entities/notification-delivery.entity';
import { NotificationPreference } from '../entities/notification-preference.entity';

export const NotificationDataSource = new DataSource({
  type: 'postgres',
  host: process.env.NOTIFICATION_DB_HOST || 'localhost',
  port: parseInt(process.env.NOTIFICATION_DB_PORT) || 5435,
  username: process.env.NOTIFICATION_DB_USERNAME || 'postgres',
  password: process.env.NOTIFICATION_DB_PASSWORD || 'postgres',
  database: process.env.NOTIFICATION_DB_NAME || 'tiktok_notification',
  entities: [Notification, NotificationDelivery, NotificationPreference],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: false,
  logging: false,
});