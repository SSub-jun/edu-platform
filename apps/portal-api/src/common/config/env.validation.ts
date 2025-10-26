import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // Portal Database
  PORTAL_DATABASE_URL: Joi.string().required(),
  
  // Portal JWT
  PORTAL_JWT_SECRET: Joi.string().min(32).required(),
  
  // Portal Admin
  PORTAL_ADMIN_USER: Joi.string().required(),
  PORTAL_ADMIN_PASS: Joi.string().required(),
  // Admin magic login (for kiosk/fast entry)
  PORTAL_ADMIN_MAGIC_CODE: Joi.string().default('KIST'),
  PORTAL_ADMIN_MAGIC_NAME: Joi.string().default('관리자'),
  PORTAL_ADMIN_MAGIC_PIN: Joi.string().default('2017'),
  
  // Portal Configuration
  PORTAL_BASE_URL: Joi.string().uri().required(),
  PORTAL_SESSION_CODE_LEN: Joi.number().min(6).max(10).default(8),
  PORTAL_PASSING_SCORE: Joi.number().min(0).max(100).default(70),
  PORTAL_DEFAULT_QUESTION_COUNT: Joi.number().min(1).max(100).default(20),
  PORTAL_MIN_CHOICES_PER_QUESTION: Joi.number().min(2).max(10).default(3),
  PORTAL_MAX_CHOICES_PER_QUESTION: Joi.number().min(3).max(20).default(10),
  PORTAL_SEED_QUESTION_COUNT: Joi.number().min(10).default(60),
  
  // Server
  PORT: Joi.number().default(4100),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
});




