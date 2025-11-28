import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthDbModule } from '@app/auth-db';
import { RedisModule } from '@app/redis';
import { KafkaModule } from '@app/kafka';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { HealthController } from './health.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthDbModule,
    RedisModule,
    KafkaModule.register({ name: 'auth-service' }),
    PassportModule,
    JwtModule.register({}),
  ],
  controllers: [AuthController, HealthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
})
})
export class AuthModule {}
