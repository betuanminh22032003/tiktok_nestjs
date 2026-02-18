// ⚡ QUAN TRỌNG: Import tracing TRƯỚC TẤT CẢ các import khác
// OpenTelemetry cần được khởi tạo đầu tiên để monkey-patch các thư viện (http, express, grpc...)
import '@app/common/tracing';

import { AllExceptionsFilter } from '@app/common/filters';
import { TransformInterceptor } from '@app/common/interceptors';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as compression from 'compression';

import helmet from 'helmet';
import { ApiGatewayModule } from './api-gateway.module';

async function bootstrap() {
  const logger = new Logger('APIGateway');
  const app = await NestFactory.create<NestExpressApplication>(ApiGatewayModule);

  const configService = app.get(ConfigService);

  // Serve static files (uploaded videos, images)
  app.use(helmet());
  app.use(compression());

  // CORS
  const isProduction = configService.get('NODE_ENV') === 'production';
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5555', // Frontend dev server
  ];

  app.enableCors({
    origin: isProduction ? allowedOrigins : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie'],
  });

  // Global Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global Filters and Interceptors
  // LoggingInterceptor được đăng ký qua APP_INTERCEPTOR trong module (cần DI)
  // TransformInterceptor wrap response thành { success, data, timestamp }
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('TikTok Clone API')
    .setDescription('TikTok Clone Microservices API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .addCookieAuth('access_token')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('PORT', 4000);
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 API Gateway is running on http://localhost:${port}`);
  logger.log(`📚 Swagger docs available at http://localhost:${port}/api/docs`);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM signal received: closing HTTP server');
    await app.close();
  });

  process.on('SIGINT', async () => {
    logger.log('SIGINT signal received: closing HTTP server');
    await app.close();
  });
}

bootstrap();
