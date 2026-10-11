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
}
