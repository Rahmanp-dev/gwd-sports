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

  /**
   * Required for server-side payment settlement. Without it every Razorpay
   * webhook is rejected, which means a payment is only recorded if the parent's
   * browser makes it back to /verify-payment. Set this in production.
   */
  RAZORPAY_WEBHOOK_SECRET: z.string().default(""),

  /**
   * Fee split rates in basis points. See src/lib/payments/money.ts.
   * GWD_GATEWAY_RATE_BPS: 236 = 2.36% (Razorpay 2% + 18% GST, no input tax
   * credit claimed). Set to 200 if GWD is GST-registered and reclaims the GST.
   * GWD_MARGIN_RATE_BPS: platform-wide default; an academy's own
   * platformFeePercent overrides it per tenant.
   */
  GWD_GATEWAY_RATE_BPS: z.coerce.number().default(236),
  GWD_MARGIN_RATE_BPS: z.coerce.number().default(100),

  // Email (Resend)
  RESEND_API_KEY: z.string().default(''),
  FROM_EMAIL: z.string().default('noreply@gwd.in'),

  // SMS (MSG91) — used as the WhatsApp delivery-failure fallback.
  // NOTE: Indian transactional SMS requires a DLT-registered template per
  // message type. Without MSG91_TEMPLATE_ID_GENERIC the fallback records as
  // 'skipped' rather than sending.
  MSG91_API_KEY: z.string().default(''),
  MSG91_TEMPLATE_ID_OTP: z.string().default(''),
  MSG91_TEMPLATE_ID_GENERIC: z.string().default(''),

  /**
   * WhatsApp via Interakt (BSP). Without INTERAKT_API_KEY the messaging engine
   * still queues and schedules everything, but sends resolve to the no-op
   * provider and are recorded as 'skipped' with a reason — never as failures.
   *
   * INTERAKT_WEBHOOK_SECRET authenticates delivery-status callbacks. Interakt
   * does not sign its payloads, so this shared token IS the credential: the
   * webhook URL must not be logged or shared.
   */
  INTERAKT_API_KEY: z.string().default(''),
  INTERAKT_WEBHOOK_SECRET: z.string().default(''),

  /** Authenticates /api/jobs/* cron endpoints. Required in production. */
  CRON_SECRET: z.string().default(''),

  // Messaging frequency cap and quiet hours. See lib/messaging/scheduling.ts.
  GWD_DAILY_MESSAGE_BUDGET: z.coerce.number().default(3),
  GWD_PAYMENT_MESSAGE_RESERVE: z.coerce.number().default(1),
  GWD_QUIET_START_HOUR: z.coerce.number().default(21),
  GWD_QUIET_END_HOUR: z.coerce.number().default(8),
  GWD_PREFERRED_SEND_HOUR: z.coerce.number().default(10),
  GWD_TZ_OFFSET_MINUTES: z.coerce.number().default(330),

  // Observability
  SENTRY_DSN: z.string().default(''),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().default(''),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().default('https://app.posthog.com'),

  // Media (Cloudinary)
  CLOUDINARY_CLOUD_NAME: z.string().default(''),
  CLOUDINARY_API_KEY: z.string().default(''),
  CLOUDINARY_API_SECRET: z.string().default(''),

  // Razorpay subscription plan IDs
  RAZORPAY_PLAN_ID_MONTHLY: z.string().default(''),
  RAZORPAY_PLAN_ID_QUARTERLY: z.string().default(''),
  RAZORPAY_PLAN_ID_YEARLY: z.string().default(''),
});

const env = envSchema.parse(process.env);

export default env;
