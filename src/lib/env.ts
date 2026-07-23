import { z } from "zod";

const envSchema = z.object({
  APP_NAME: z.string().default("GWD Sports Ecosystem"),
  APP_ID: z.string().default("GWD_1"),

  NODE_ENV: z.string().default("development"),

  PORT: z.coerce.number().default(3000),

  DB_URI: z.string().default("mongodb://localhost:27017/sports"),
  DB_NAME: z.string().default("sports"),

  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters")
    .default("gwd_sports_ecosystem_super_secret_jwt_access_key_2026"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters")
    .default("gwd_sports_ecosystem_super_secret_jwt_refresh_key_2026"),

  // Allow both numbers and strings for expiresIn
  JWT_EXPIRES_IN: z.union([z.string(), z.coerce.number()]).default("7d"),
  JWT_REFRESH_EXPIRES_IN: z.union([z.string(), z.coerce.number()]).default("7d"),

  BCRYPT_ROUNDS: z.coerce.number().default(12),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

  RAZORPAY_KEY_ID: z.string().default(""),
  RAZORPAY_KEY_SECRET: z.string().default(""),
});

const env = envSchema.parse(process.env);

export default env;
