import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // API 서버 설정
  API_PORT: Joi.number().default(4000),
  
  // 데이터베이스 설정
  DATABASE_URL: Joi.string().required(),
  
  // JWT 설정
  JWT_SECRET: Joi.string().required(),
  ACCESS_TOKEN_TTL: Joi.string().default('15m'),
  REFRESH_TOKEN_TTL: Joi.string().default('7d'),
  
  // OTP 설정
  OTP_CODE_TTL_SECONDS: Joi.number().default(300),
  OTP_RESEND_INTERVAL_SECONDS: Joi.number().default(30),
  OTP_DAILY_LIMIT: Joi.number().default(10),
  AUTH_OTP_JWT_SECRET: Joi.string().required().error(new Error('AUTH_OTP_JWT_SECRET is required for OTP functionality')),
  
  // SMS 설정
  SMS_PROVIDER: Joi.string().valid('mock', 'solapi').default('mock'),
  SMS_SENDER_ID: Joi.string().default('EDU-PLATFORM'),
  
  // SOLAPI 설정 (SMS_PROVIDER가 'solapi'일 때 필요)
  SOLAPI_API_KEY: Joi.string().optional(),
  SOLAPI_API_SECRET: Joi.string().optional(),
  SOLAPI_FROM_NUMBER: Joi.string().optional(),
  
  // 인증 모드 설정
  AUTH_MODE: Joi.string().valid('mock', 'db').default('mock'),
  
  // 본인인증 설정
  VERIFY_ON_COURSE_START: Joi.boolean().default(false),
  VERIFY_PROVIDER: Joi.string().default('mock'),
  
  // 환경 설정
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
});
