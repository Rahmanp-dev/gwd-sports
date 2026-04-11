import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.string().default("development"),

  PORT: z.coerce.number().default(3000),

  DB_URI: z.string(),
  DB_NAME: z.string().default("sports"),

  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),

  // Allow both numbers and strings for expiresIn
  JWT_EXPIRES_IN: z.union([z.string(), z.coerce.number()]).default("7d"),
  JWT_REFRESH_EXPIRES_IN: z.union([z.string(), z.coerce.number()]).default("7d"),

  BCRYPT_ROUNDS: z.coerce.number().default(12),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),

  RAZORPAY_KEY_ID: z.string().min(1, "RAZORPAY_KEY_ID is required"),
  RAZORPAY_KEY_SECRET: z.string().min(1, "RAZORPAY_KEY_SECRET is required"),
});

const env = envSchema.parse(process.env);

export default env;