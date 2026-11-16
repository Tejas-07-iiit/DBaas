# M-DBaaS: Complete Razorpay Subscription Billing Integration

Act as a Principal Backend Engineer, Payment Systems Architect and Application Security Engineer.

Implement a complete, secure, production-ready Razorpay subscription billing system in the existing M-DBaaS codebase.

You MUST follow the existing architecture specification (M-DBaaS v2.4.0) and actual implementation.

This is an existing, functioning application. Your responsibility is to integrate Razorpay into the existing billing architecture, not redesign the platform.

==================================================
1. FIRST: INSPECT THE EXISTING IMPLEMENTATION
==================================================

Before making any changes, inspect the entire existing billing implementation.

Pay particular attention to:

BACKEND:
- Existing Prisma schema.
- Subscription model.
- SubscriptionTier enum.
- SubscriptionStatus enum.
- Billing controller and service.
- Existing Stripe integration.
- Existing FirebaseAuthGuard.
- CurrentUser decorator.
- ProjectAuthorizationService.
- Project OWNER authorization.
- DatabaseQuotaService.
- Existing AuditLog implementation.
- Existing validation pipes.
- Existing exception handling.
- Existing API versioning.

FRONTEND:
- /dashboard/subscription
- Existing subscription page components.
- Existing plan comparison UI.
- Existing checkout implementation.
- API client and authentication token handling.
- TanStack Query integration.
- Existing demo mode implementation.

INFRASTRUCTURE:
- PostgreSQL and Prisma.
- Redis and BullMQ.
- Docker configuration.
- Environment variables.
- Existing deployment configuration.

First produce a concise technical assessment explaining:

1. What billing functionality already exists.
2. Which parts currently depend on Stripe.
3. Which existing models can be reused.
4. Which database changes are required.
5. Which existing endpoints need modification.
6. How subscription status currently affects database provisioning.

Do not begin modifying files until you understand these dependencies.

==================================================
2. ARCHITECTURAL REQUIREMENTS
==================================================

Strictly preserve these architectural principles.

A. NestJS is the single gateway.

All payment-related operations must go through NestJS.

The frontend must never communicate directly with Razorpay APIs using secret credentials.

B. Project-level subscriptions.

Every subscription belongs to a Project.

Use the existing relationship:

Project → Subscription

Preserve the existing unique projectId constraint.

Do not create user-level subscriptions.

C. Billing permissions.

Only the Project OWNER can:

- Purchase a subscription.
- Upgrade a subscription.
- Downgrade a subscription.
- Cancel a subscription.
- View project billing information.
- Access project payment history.

Project ADMIN, MEMBER and VIEWER roles must not automatically receive billing permissions.

Use the existing ProjectAuthorizationService.

D. Existing authentication.

Continue using Firebase Authentication and FirebaseAuthGuard.

Do not introduce another authentication system.

E. Existing quota enforcement.

Continue using DatabaseQuotaService.

Do not implement a second quota calculation system.

==================================================
3. RAZORPAY INTEGRATION
==================================================

Replace the existing Stripe payment integration with Razorpay Subscriptions.

Official documentation:

https://razorpay.com/docs/payments/subscriptions/

https://razorpay.com/docs/api/payments/subscriptions/create-plan/

https://razorpay.com/docs/webhooks/

Use the official Razorpay Node.js SDK.

Implement a dedicated Razorpay provider/service layer.

Suggested architecture:

backend/src/modules/billing/

- billing.module.ts
- billing.controller.ts
- subscription.service.ts
- subscription.controller.ts
- razorpay.service.ts
- payment.service.ts
- webhook.service.ts
- entitlement.service.ts
- subscription-reconciliation.service.ts
- dto/
- guards/
- interfaces/
- enums/

Adapt the structure to the existing NestJS module conventions.

The billing business logic must remain independent of Razorpay-specific API calls as much as reasonably possible.

Initially support INR recurring subscriptions.

Use Razorpay Test Mode during development.

==================================================
4. SUBSCRIPTION PLAN CONFIGURATION
==================================================

Maintain three existing subscription tiers.

FREE:
- 2 databases
- 4 vCPU
- 4 GB RAM
- 20 GB storage

BASIC:
- 5 databases
- 16 vCPU
- 16 GB RAM
- 100 GB storage

PRO:
- 20 databases
- 64 vCPU
- 64 GB RAM
- 500 GB storage

These values must remain consistent with the existing specification and DatabaseQuotaService.

Pricing must be configurable.

Do not invent prices.

Do not hardcode prices separately in the frontend and backend.

The database must be the authoritative source of plan configuration.

Support:

- Monthly billing.
- Yearly billing.
- INR currency.
- Internal plan identifiers.
- Razorpay provider plan identifiers.
- Active/inactive plans.
- Resource entitlements.

Use Razorpay Plan API to create recurring billing plans.

Create a reliable plan synchronization mechanism.

Important:

- Do not create duplicate Razorpay plans.
- Do not recreate plans on every checkout.
- Do not change existing subscriptions when a plan price changes.
- Create a new Razorpay Plan when a new price configuration is introduced.
- Preserve historical plan and payment information.

FREE must not require Razorpay checkout.

A customer must be able to use the Free tier without entering payment information.

==================================================
5. DATABASE AND PRISMA MIGRATION
==================================================

The existing Subscription model already contains:

- tier
- status
- stripeCustomerId
- stripeSubscriptionId
- currentPeriodStart
- currentPeriodEnd
- projectId

Preserve the existing model and relationships.

Replace Stripe-specific provider fields with appropriate Razorpay-compatible fields through a safe database migration.

Do not simply delete existing Stripe fields without considering existing records.

Create or extend the following billing records as required.

A. Subscription

Store:

- Internal subscription ID.
- Project ID.
- Subscription tier.
- Subscription status.
- Payment provider.
- Razorpay subscription ID.
- Razorpay plan ID.
- Current billing period.
- Next billing date.
- Cancellation status.
- Cancellation effective date.
- Created and updated timestamps.

B. Plan

Store:

- Internal plan ID.
- Tier.
- Billing interval.
- Amount in paise.
- Currency.
- Razorpay Plan ID.
- Resource quotas.
- Active status.

C. Payment

Store:

- Internal payment ID.
- Project ID.
- Subscription ID.
- Razorpay payment ID.
- Amount.
- Currency.
- Payment status.
- Payment method metadata where available.
- Payment timestamp.
- Failure details.

D. WebhookEvent

Store:

- Unique provider event ID.
- Event type.
- Verified payload.
- Processing status.
- Retry count.
- Error details.
- Received timestamp.
- Processed timestamp.

E. SubscriptionHistory

Record subscription lifecycle changes and billing-related activities.

Add proper indexes, unique constraints and foreign keys.

Use database transactions for related billing changes.

Use integer monetary amounts in paise. Never use floating-point calculations for money.

Do not remove payment history when subscriptions change.

==================================================
6. BACKEND API IMPLEMENTATION
==================================================

Preserve the existing API versioning and naming conventions.

The existing billing endpoints are:

GET /api/v1/plans
GET /api/v1/subscription
POST /api/v1/subscription/checkout
POST /api/v1/subscription/cancel
POST /api/v1/webhooks/stripe

Modify these endpoints rather than unnecessarily introducing a completely different API structure.

Required behavior:

A. GET /api/v1/plans

- Return active plans.
- Include pricing and resource limits.
- Support monthly and yearly plans.
- Do not expose provider secrets.

B. GET /api/v1/subscription

- Return subscription for the selected project.
- Validate project membership.
- Enforce project billing ownership for sensitive billing details.
- Return current tier, status, billing period and next billing date.

C. POST /api/v1/subscription/checkout

Request:
- projectId
- planId

Backend:
1. Authenticate the user.
2. Validate project ownership.
3. Validate the requested plan.
4. Check whether a compatible active subscription already exists.
5. Retrieve the Razorpay Plan ID from PostgreSQL.
6. Create the Razorpay subscription server-side.
7. Persist the provider subscription reference.
8. Return the necessary Checkout details.

Never accept amount, currency, quotas or provider plan IDs as authoritative frontend inputs.

D. POST /api/v1/subscription/verify

Implement a secure payment verification endpoint.

Validate:
- Authenticated user.
- Project ownership.
- Internal subscription ownership.
- Razorpay signature.
- Payment ID.
- Subscription ID.
- Expected amount and currency.
- Provider-side payment/subscription state where required.

Do not activate subscriptions based solely on frontend Checkout success.

E. POST /api/v1/subscription/cancel

- Only Project OWNER can cancel.
- Validate the subscription belongs to the project.
- Support cancellation at the end of the billing period where supported.
- Synchronize cancellation with Razorpay.
- Preserve existing customer data and resources.
- Record the cancellation event.

F. Payment history

Add an authenticated payment history endpoint if one does not already exist.

It must only return payments belonging to the selected project.

Use pagination.

==================================================
7. RAZORPAY WEBHOOK IMPLEMENTATION
==================================================

Implement:

POST /api/v1/webhooks/razorpay

This endpoint must not require Firebase JWT authentication because Razorpay calls it directly.

However, it must strictly verify Razorpay's webhook signature.

Use:

X-Razorpay-Signature

Verify using:

HMAC-SHA256(rawRequestBody, RAZORPAY_WEBHOOK_SECRET)

Requirements:

1. Configure NestJS raw body handling correctly.
2. Verify the signature against the original request bytes.
3. Use timing-safe signature comparison.
4. Reject missing or invalid signatures.
5. Do not parse and reserialize the payload before verification.
6. Never process unverified webhooks.
7. Persist the verified event.
8. Implement event idempotency.
9. Prevent duplicate payment records.
10. Handle concurrent webhook deliveries.
11. Handle events arriving out of order.
12. Implement retry-safe processing.

Use the unique Razorpay event identifier from the webhook request where available.

Support the relevant Razorpay events:

- subscription.authenticated
- subscription.activated
- subscription.charged
- subscription.pending
- subscription.halted
- subscription.cancelled
- subscription.completed
- payment.captured
- payment.failed

Verify the actual event schemas using official Razorpay documentation.

Do not assume event payloads have identical structures.

Implement proper subscription state transitions.

A failed webhook must be recoverable without duplicating financial or entitlement operations.

Use BullMQ or a reliable database-backed processing mechanism if appropriate.

Do not block webhook acknowledgment on long-running infrastructure operations.

==================================================
8. SUBSCRIPTION STATE MANAGEMENT
==================================================

Map Razorpay subscription statuses to the existing internal SubscriptionStatus enum.

Existing statuses:

- ACTIVE
- CANCELED
- PAST_DUE
- TRIALING

Preserve existing compatibility wherever possible.

If additional internal states are necessary, introduce them through safe migrations.

Do not blindly replace existing status values.

Implement a clear lifecycle mapping.

Examples:

New checkout → Subscription created.

Successful authentication → Awaiting activation/payment confirmation as applicable.

Successful initial payment and verified activation → ACTIVE.

Successful recurring payment → Update billing period and payment history.

Failed recurring payment → PAST_DUE, according to the verified provider state.

Cancellation → Preserve access until the effective cancellation date where applicable.

Completed subscription → Apply the defined expiration policy.

Do not equate payment authorization with successful recurring payment.

Never grant paid entitlements without appropriate verified payment and subscription state.

==================================================
9. INTEGRATION WITH DATABASE QUOTA ENFORCEMENT
==================================================

This is a critical requirement.

The existing DatabaseQuotaService is responsible for:

- Maximum database count.
- Total allocated CPU.
- Total allocated RAM.
- Total allocated storage.

Preserve its existing serializable PostgreSQL transaction model.

The subscription system must supply the appropriate tier and entitlements to this service.

When a subscription becomes active:

1. Update the project's subscription.
2. Determine its new tier.
3. Load the corresponding plan quotas.
4. Make the new quotas available to DatabaseQuotaService.
5. Record the entitlement change.

When provisioning a database:

- Validate project subscription.
- Validate database count.
- Validate CPU.
- Validate RAM.
- Validate storage.
- Execute quota validation and database record creation atomically.

Do not bypass the existing quota transaction.

Do not duplicate quota calculations in controllers.

Do not allow users to modify quota values through public APIs.

IMPORTANT: When downgrading a subscription, existing resource allocations may exceed the new plan's quotas.

In this situation:

- Do not delete existing databases.
- Do not stop existing VMs automatically.
- Prevent new provisioning that exceeds the new limits.
- Display an appropriate quota-exceeded message.
- Require the customer to reduce usage or upgrade.

==================================================
10. PAYMENT FAILURE AND GRACE PERIOD
==================================================

Implement a configurable payment grace period.

Do not immediately delete databases or VMs after a failed payment.

During the grace period:

- Notify the Project OWNER.
- Display payment status.
- Allow payment recovery.
- Apply the configured restrictions on new provisioning.

After the grace period:

- Apply the defined suspension policy.
- Restrict new provisioning.
- Preserve existing customer data.
- Never automatically destroy customer infrastructure.

Keep billing suspension and infrastructure destruction as separate operations.

==================================================
11. SECURITY REQUIREMENTS
==================================================

Implement comprehensive security for billing APIs.

AUTHENTICATION:
- Use FirebaseAuthGuard.
- Validate Firebase ID tokens.
- Use CurrentUser for authenticated identity.
- Never trust userId submitted by the frontend.

AUTHORIZATION:
- Use ProjectAuthorizationService.
- Only Project OWNER can modify billing.
- Prevent cross-project subscription access.
- Apply the existing strict 404 disclosure policy for unauthorized project/resource discovery.
- Use 403 only for authenticated project members with insufficient privileges, according to the existing policy.

VALIDATION:
- Follow the existing Zod validation conventions.
- Reject unexpected request fields.
- Validate UUIDs, plan identifiers, amounts and other input types.
- Never trust frontend pricing or entitlement information.

RATE LIMITING:
- Checkout creation.
- Payment verification.
- Cancellation.
- Administrative billing operations.

PAYMENT SECURITY:
- Verify Checkout signatures.
- Verify webhook signatures.
- Use separate API and webhook secrets.
- Use timing-safe comparisons.
- Implement idempotency.
- Prevent duplicate subscription creation.
- Prevent payment replay attacks.
- Verify payment ownership.

GENERAL SECURITY:
- HTTPS in production.
- Strict CORS.
- Secure response headers.
- No secret leakage in logs.
- Safe error responses.
- Request body limits.
- CSRF protection where cookie authentication is used.

Never expose:
- Razorpay API Secret.
- Razorpay Webhook Secret.
- Internal database credentials.
- Sensitive provider responses.

==================================================
12. FRONTEND INTEGRATION
==================================================

Modify the existing:

/dashboard/subscription

Do not create a separate billing dashboard.

Preserve the existing Graphite + Emerald design system.

Use existing UI components and TanStack Query architecture.

The page should contain:

1. Current subscription.
2. Available plans.
3. Monthly/yearly billing selection.
4. Resource quota comparison.
5. Current resource usage.
6. Upgrade option.
7. Downgrade option.
8. Cancellation option.
9. Next billing date.
10. Payment history.
11. Payment status.

Integrate Razorpay Hosted Checkout.

Checkout flow:

1. User selects a plan.
2. Frontend requests checkout initialization from NestJS.
3. NestJS creates a Razorpay subscription.
4. Frontend receives the necessary Checkout information.
5. Razorpay Checkout opens.
6. Customer completes the payment flow.
7. Frontend sends the Checkout response to NestJS verification endpoint.
8. Backend verifies the signature and provider state.
9. Webhook processing synchronizes the final subscription state.
10. Frontend refreshes subscription information from the backend.

Prevent duplicate checkout submissions.

Display meaningful payment errors.

Do not display a paid subscription as active merely because Razorpay Checkout returned successfully.

Preserve the existing demo mode. Do not allow demo mode to create real Razorpay subscriptions.

==================================================
13. STRIPE REMOVAL AND MIGRATION
==================================================

The current implementation contains Stripe-specific fields and endpoints.

Replace the Stripe integration with Razorpay carefully.

Inspect all Stripe references across:

- Backend services.
- Controllers.
- Prisma schema.
- Frontend API client.
- Checkout components.
- Environment variables.
- Documentation.
- Tests.

Requirements:

- Remove unused Stripe runtime dependencies after successful migration.
- Replace the Stripe webhook route.
- Replace Stripe environment variables.
- Replace Stripe provider-specific database references.
- Preserve existing project subscriptions.
- Preserve historical payment records where available.
- Do not silently discard existing Stripe data.
- Do not automatically cancel existing subscriptions without an explicit migration decision.

If existing Stripe subscriptions are present, report the migration requirements separately.

==================================================
14. AUDIT LOGGING
==================================================

Use the existing AuditLog model.

Record:

- Checkout initiated.
- Subscription created.
- Payment verified.
- Payment failed.
- Subscription activated.
- Subscription upgraded.
- Subscription downgraded.
- Subscription cancelled.
- Webhook signature rejected.
- Webhook processed.
- Unauthorized billing access.

Include project ID, actor ID, event type, timestamp and relevant non-sensitive metadata.

Never log payment secrets or sensitive card information.

==================================================
15. TESTING
==================================================

Add tests using the existing test framework.

Payment tests:
- Successful checkout initialization.
- Invalid plan.
- Unauthenticated checkout.
- Non-owner checkout.
- Invalid signature.
- Wrong subscription ID.
- Wrong payment ID.
- Duplicate payment verification.
- Failed recurring payment.
- Successful recurring payment.

Webhook tests:
- Valid signature.
- Invalid signature.
- Missing signature.
- Duplicate event.
- Concurrent events.
- Out-of-order events.
- Invalid payload.
- Retry after processing failure.

RBAC tests:
- Project OWNER can manage billing.
- Project ADMIN cannot manage billing.
- MEMBER cannot manage billing.
- VIEWER cannot manage billing.
- Cross-project access returns the expected 404.
- Unauthenticated requests return 401.

Quota tests:
- Free tier limits.
- Basic tier limits.
- Pro tier limits.
- Upgrade quota updates.
- Downgrade with existing over-allocation.
- Concurrent provisioning.
- Failed payment grace period.
- No automatic database destruction.

Run the existing test suite as well.

Do not break existing tenant isolation, provisioning or lifecycle tests.

==================================================
16. ENVIRONMENT CONFIGURATION
==================================================

Add the following to the backend environment configuration:

RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
RAZORPAY_MODE=test

Use the appropriate configuration names if the existing project has a different convention.

Never place the secret in NEXT_PUBLIC environment variables.

Update .env.example without including actual credentials.

Validate required configuration during backend startup.

Keep test and live configurations separate.

==================================================
17. IMPLEMENTATION STRATEGY
==================================================

Implement in the following order:

PHASE A:
Codebase inspection and existing billing assessment.

PHASE B:
Prisma schema changes and safe migrations.

PHASE C:
Razorpay provider and plan synchronization.

PHASE D:
Subscription checkout and payment verification.

PHASE E:
Webhook security and idempotent processing.

PHASE F:
Subscription lifecycle and quota integration.

PHASE G:
Billing endpoint security and RBAC.

PHASE H:
Frontend checkout and billing dashboard.

PHASE I:
Stripe migration and cleanup.

PHASE J:
Testing and production readiness.

After each phase:

- Run relevant tests.
- Check TypeScript compilation.
- Check Prisma validation and generation.
- Review affected existing functionality.
- Fix regressions before proceeding.

Do not perform destructive database operations.

Do not use prisma db push as a replacement for production migration management.

Use proper Prisma migrations.

==================================================
18. FINAL REPORT
==================================================

After implementation, provide:

1. Existing architecture inspected.
2. Existing billing implementation discovered.
3. Files created.
4. Files modified.
5. Prisma migrations created.
6. Razorpay configuration required.
7. API endpoints implemented.
8. Webhook events supported.
9. Signature verification implementation.
10. Subscription state management.
11. Project OWNER authorization implementation.
12. DatabaseQuotaService integration.
13. Stripe migration status.
14. Test results.
15. Remaining manual Razorpay Dashboard configuration.
16. Exact instructions for testing a subscription in Test Mode.

Clearly distinguish completed functionality from pending configuration.

Do not claim payment integration is complete if credentials, webhook configuration, provider account permissions or required tests are still missing.

==================================================
FINAL ARCHITECTURAL RULES
==================================================

1. NestJS remains the single gateway.
2. Firebase remains the authentication provider.
3. Subscriptions remain project-level.
4. Project OWNER remains the billing authority.
5. DatabaseQuotaService remains the quota authority.
6. PostgreSQL remains the billing source of truth.
7. Razorpay is the payment provider.
8. Webhooks are mandatory for reliable subscription synchronization.
9. Verified backend state controls entitlements.
10. Existing infrastructure must never be destroyed automatically because of payment failure.
11. Preserve existing application functionality.
12. Do not introduce unnecessary architectural complexity.

Start by inspecting the actual codebase. Then implement the complete integration incrementally.
