export interface AppConfig {
  nodeEnv: string;
  port: number;
  database: {
    url: string;
  };
  redis: {
    host: string;
    port: number;
  };
  firebase: {
    projectId: string;
    clientEmail: string;
    privateKey: string;
  };
  razorpay?: {
    keyId: string;
    keySecret: string;
    webhookSecret: string;
    mode: 'test' | 'live';
  };
  paymentEnabled?: boolean;
}
