import { Module } from '@nestjs/common';
import { PlansController, SubscriptionController } from './subscription.controller';
import { WebhookController } from './webhook.controller';
import { SubscriptionService } from './subscription.service';
import { RazorpayService } from './razorpay.service';
import { WebhookService } from './webhook.service';
import { PlanSeedService } from './plan-seed.service';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [PrismaModule, UsersModule, AuthModule, ProjectsModule],
  controllers: [PlansController, SubscriptionController, WebhookController],
  providers: [
    SubscriptionService,
    RazorpayService,
    WebhookService,
    PlanSeedService,
  ],
  exports: [SubscriptionService, RazorpayService, WebhookService],
})
export class SubscriptionModule {}
