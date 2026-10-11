import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProjectsModule } from './projects/projects.module';
import { TeamModule } from './team/team.module';
import { DatabaseEnginesModule } from './database-engines/database-engines.module';
import { DatabasesModule } from './databases/databases.module';
import { HealthModule } from './health/health.module';
import { BullModule } from './bull/bull.module';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      cache: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProjectsModule,
    TeamModule,
    DatabaseEnginesModule,
    DatabasesModule,
    HealthModule,
    BullModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
