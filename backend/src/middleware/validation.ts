// validators.ts
import { Request, Response, NextFunction } from "express";
import { z, ZodSchema } from "zod";

/**
 * Middleware factory to validate requests using Zod
 */
export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          status: "error",
          message: "Invalid request data",
          errors: error.errors,
        });
      }
      next(error);
    }
  };
};

// ------------------- Shared Schemas -------------------
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
  );

const phoneSchema = z
  .string()
  .regex(/^[+]?[\d\s\-\(\)]{10,}$/, "Please provide a valid phone number");

const roleSchema = z.enum(["admin", "trainer", "student", "user"]);

// ------------------- Validators -------------------
export const validateRegister = validateRequest(
  z.object({
    body: z.object({
      name: z.string().min(2).max(50),
      email: z.string().email(),
      password: passwordSchema,
      phone: phoneSchema,
      role: roleSchema.optional(),
      sports: z.array(z.string()).optional(),
    }),
  })
);

export const validateLogin = validateRequest(
  z.object({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(1, "Password is required"),
    }),
  })
);

export const validateUpdateProfile = validateRequest(
  z.object({
    body: z.object({
      name: z.string().min(2).max(50).optional(),
      phone: phoneSchema.optional(),
      sports: z.array(z.string()).optional(),
    }),
  })
);

export const validateChangePassword = validateRequest(
  z.object({
    body: z.object({
      currentPassword: z.string().min(1, "Current password is required"),
      newPassword: passwordSchema,
    }),
  })
);

export const validateUserId = validateRequest(
  z.object({
    params: z.object({
      id: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID"), // MongoDB ObjectId
    }),
  })
);

export const validatePagination = validateRequest(
  z.object({
    query: z.object({
      page: z
        .string()
        .regex(/^\d+$/)
        .transform(Number)
        .pipe(z.number().min(1))
        .optional(),
      limit: z
        .string()
        .regex(/^\d+$/)
        .transform(Number)
        .pipe(z.number().min(1).max(100))
        .optional(),
    }),
  })
);

export const validateCreateUser = validateRequest(
  z.object({
    body: z.object({
      name: z.string().min(2).max(50),
      email: z.string().email(),
      password: passwordSchema,
      phone: phoneSchema,
      role: roleSchema,
      sports: z.array(z.string()).optional(),
    }),
  })
);

export const validateUpdateUser = validateRequest(
  z.object({
    params: z.object({
      id: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID"),
    }),
    body: z.object({
      name: z.string().min(2).max(50).optional(),
      email: z.string().email().optional(),
      phone: phoneSchema.optional(),
      role: roleSchema.optional(),
      sports: z.array(z.string()).optional(),
      isActive: z.boolean().optional(),
    }),
  })
);