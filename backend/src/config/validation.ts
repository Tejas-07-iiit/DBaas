import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_HOST: z.string().min(1, 'REDIS_HOST is required').default('redis'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  FIREBASE_PROJECT_ID: z.string().optional().default(''),
  FIREBASE_CLIENT_EMAIL: z.string().optional().default(''),
  FIREBASE_PRIVATE_KEY: z.string().optional().default(''),
  INFRASTRUCTURE_PROVIDER: z.enum(['mock', 'local', 'central-management']).default('mock'),
  ENCRYPTION_KEY: z.string().optional().default('dbaas-default-dev-encryption-key-32b!'),
  MANAGEMENT_API_URL: z.string().optional(),
  CENTRAL_MANAGEMENT_URL: z.string().optional().default('http://192.168.122.7:8080'),
  CENTRAL_MANAGEMENT_API_KEY: z.string().optional().default(''),
  CORS_ORIGIN: z.string().optional().default('*'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().optional().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional().default('DBaaS Cloud <no-reply@dbaas.local>'),
  FRONTEND_URL: z.string().optional().default('http://localhost:3000'),
  RAZORPAY_KEY_ID: z.string().optional().default('rzp_test_mock_key_id'),
  RAZORPAY_KEY_SECRET: z.string().optional().default('rzp_test_mock_key_secret'),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default('rzp_test_webhook_secret'),
  RAZORPAY_MODE: z.enum(['test', 'live']).default('test'),
  PAYMENT_ENABLED: z
    .union([z.boolean(), z.string()])
    .optional()
    .default(true)
    .transform((val) => {
      if (typeof val === 'boolean') return val;
      const str = String(val).toLowerCase().trim();
      return str !== 'false' && str !== '0' && str !== 'disabled';
    }),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    const errorMessages = Object.entries(errors)
      .map(([key, msgs]) => `  ${key}: ${(msgs || []).join(', ')}`)
      .join('\n');
    throw new Error(
      `Environment validation failed:\n${errorMessages}\n\nCheck your .env file or environment variables.`,
    );
  }
  return result.data;
}
