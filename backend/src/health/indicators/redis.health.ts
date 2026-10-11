import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const redis = new Redis({
      host: this.configService.get<string>('redis.host'),
      port: this.configService.get<number>('redis.port'),
      connectTimeout: 3000,
      lazyConnect: true,
    });

    try {
      await redis.connect();
      const pong = await redis.ping();
      await redis.disconnect();

      if (pong === 'PONG') {
        return this.getStatus(key, true);
      }
      return this.getStatus(key, false, { message: 'Redis ping failed' });
    } catch (error) {
      try { await redis.disconnect(); } catch { /* ignore */ }
      return this.getStatus(key, false, {
        message: (error as Error).message,
      });
    }
  }
}
