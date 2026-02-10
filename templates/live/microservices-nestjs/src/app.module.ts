/**
 * @fileoverview App Module module
 * @module src/app.module
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerBehindProxyGuard } from './guards/throttler-behind-proxy.guard';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PaymentsModule } from './payments/payments.module';
import { CommonModule } from './common/common.module';

const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET;

if (isProduction && !jwtSecret) {
  throw new Error('JWT_SECRET is required when NODE_ENV=production');
}

const dbPort = Number.parseInt(process.env.DB_PORT || '5432', 10);
const throttlerLimit = Number.parseInt(process.env.THROTTLER_LIMIT || '10', 10);
const throttlerTtl = Number.parseInt(process.env.THROTTLER_TTL_MS || '60000', 10);

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: Number.isFinite(dbPort) ? dbPort : 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'microservices_db',
      autoLoadEntities: true,
      synchronize: process.env.DB_SYNC === 'true' && !isProduction,
      logging: process.env.DB_LOGGING === 'true',
    }),
    JwtModule.register({
      secret: jwtSecret || 'development-only-secret',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1d' },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: Number.isFinite(throttlerTtl) ? throttlerTtl : 60000,
        limit: Number.isFinite(throttlerLimit) ? throttlerLimit : 10,
      },
    ]),
    AuthModule,
    UsersModule,
    PaymentsModule,
    CommonModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerBehindProxyGuard,
    },
  ],
})
export class AppModule {}

/**
 * Error handler for app.module
 * @param {Error} error - Error to handle
 */
function handleAppmoduleError(error) {
  try {
    console.error('[app.module]', error instanceof Error ? error.message : String(error));
  } catch (_) {
    // Fail silently
  }
}
