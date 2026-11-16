import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UsePipes,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FirebaseUser } from '../auth/interfaces/firebase-user.interface';
import { Public } from '../auth/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  checkoutSubscriptionSchema,
  CheckoutSubscriptionDto,
  verifyPaymentSchema,
  VerifyPaymentDto,
  cancelSubscriptionSchema,
  CancelSubscriptionDto,
  paymentHistoryQuerySchema,
  PaymentHistoryQueryDto,
} from './dto/billing.dto';

/**
 * Endpoint: GET /api/v1/plans (BILL-01)
 */
@Controller('plans')
export class PlansController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  @Public()
  async listPlans() {
    const plans = await this.subscriptionService.listPlans();
    return {
      data: plans,
      paymentEnabled: this.subscriptionService.isPaymentEnabled(),
    };
  }
}

/**
 * Endpoints:
 * - GET /api/v1/subscription (BILL-02)
 * - POST /api/v1/subscription/checkout (BILL-03)
 * - POST /api/v1/subscription/verify (BILL-04)
 * - POST /api/v1/subscription/cancel (BILL-05)
 * - GET /api/v1/subscription/payments (BILL-06)
 */
@Controller('subscription')
@UseGuards(FirebaseAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  async getSubscription(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Query('projectId') projectId?: string,
  ) {
    const sub = await this.subscriptionService.getSubscription(firebaseUser, projectId);
    return { data: sub };
  }

  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(checkoutSubscriptionSchema))
  async checkoutPlan(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Body() dto: CheckoutSubscriptionDto,
  ) {
    return this.subscriptionService.checkoutPlan(firebaseUser, dto);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(verifyPaymentSchema))
  async verifyPayment(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Body() dto: VerifyPaymentDto,
  ) {
    return this.subscriptionService.verifyPayment(firebaseUser, dto);
  }

  @Post('cancel')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(cancelSubscriptionSchema))
  async cancelSubscription(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Body() dto: CancelSubscriptionDto,
  ) {
    return this.subscriptionService.cancelSubscription(firebaseUser, dto);
  }

  @Get('payments')
  @UsePipes(new ZodValidationPipe(paymentHistoryQuerySchema))
  async getPayments(
    @CurrentUser() firebaseUser: FirebaseUser,
    @Query() dto: PaymentHistoryQueryDto,
  ) {
    return this.subscriptionService.getPaymentHistory(firebaseUser, dto);
  }
}
