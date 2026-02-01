/**
 * 环境变量配置
 * 验证和类型化环境变量
 */

export interface DatabaseConfig {
  url: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: boolean;
  logging: boolean;
}

export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  corsEnabled: boolean;
  corsOrigins: string[];
}

export interface AIConfig {
  integrationsApiKey: string;
  apiKey: string;
  useReal: boolean;
  stepfunApiUrl: string;
  multimodalApiUrl: string;
  multimodalModel: string;
}

export interface AuthConfig {
  jwtSecret: string;
}

export interface AllConfig {
  database: DatabaseConfig;
  app: AppConfig;
  ai: AIConfig;
  auth: AuthConfig;
}

export const configuration = (): AllConfig => ({
  database: {
    url: process.env.DATABASE_URL || '',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'mindcareai',
    synchronize: false, // 必须使用 migration，禁止自动同步
    logging: process.env.NODE_ENV === 'development',
  },
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    corsEnabled: process.env.CORS_ENABLED === 'true',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'],
  },
  ai: {
    integrationsApiKey: process.env.INTEGRATIONS_API_KEY || '',
    apiKey: process.env.API_KEY || process.env.INTEGRATIONS_API_KEY || '',
    useReal: process.env.AI_USE_REAL === 'true',
    stepfunApiUrl:
      process.env.STEPFUN_API_URL ||
      'https://api.stepfun.com/v1/chat/completions',
    multimodalApiUrl:
      process.env.MULTIMODAL_API_URL ||
      'https://api.stepfun.com/v1/chat/completions',
    multimodalModel:
      process.env.MULTIMODAL_MODEL || 'step-1o',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production'
      ? (() => { throw new Error('JWT_SECRET must be defined in production environment'); })()
      : 'mindcareai-default-secret'),
  },
});

export default configuration;
