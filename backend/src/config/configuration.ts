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
      managementApiUrl: env.MANAGEMENT_API_URL || env.CENTRAL_MANAGEMENT_URL,
      centralManagementUrl: env.MANAGEMENT_API_URL || env.CENTRAL_MANAGEMENT_URL,
      centralManagementApiKey: env.CENTRAL_MANAGEMENT_API_KEY,
    },
    email: {
      smtpHost: env.SMTP_HOST,
      smtpPort: env.SMTP_PORT,
      smtpUser: env.SMTP_USER,
      smtpPass: env.SMTP_PASS,
      smtpFrom: env.SMTP_FROM,
      frontendUrl: env.FRONTEND_URL,
    },
    razorpay: {
      keyId: env.RAZORPAY_KEY_ID,
      keySecret: env.RAZORPAY_KEY_SECRET,
      webhookSecret: env.RAZORPAY_WEBHOOK_SECRET,
      mode: env.RAZORPAY_MODE,
    },
    paymentEnabled: env.PAYMENT_ENABLED,
  };
};
