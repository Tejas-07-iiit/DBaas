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
  CENTRAL_MANAGEMENT_URL: z.string().optional().default('http://10.50.0.2:8443'),
  CENTRAL_MANAGEMENT_API_KEY: z.string().optional().default(''),
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
