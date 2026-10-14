import { validateEnv } from './validation';

export default () => {
  const env = validateEnv(process.env);
  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    database: {
      url: env.DATABASE_URL,
    },
    redis: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
    },
    firebase: {
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    infrastructure: {
      provider: env.INFRASTRUCTURE_PROVIDER,
      encryptionKey: env.ENCRYPTION_KEY,
      centralManagementUrl: env.CENTRAL_MANAGEMENT_URL,
      centralManagementApiKey: env.CENTRAL_MANAGEMENT_API_KEY,
    },
  };
};
