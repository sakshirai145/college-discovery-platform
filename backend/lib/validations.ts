import { z } from "zod";

export const collegeListQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  location: z.string().trim().max(80).optional(),
  minFees: z.coerce.number().int().min(0).optional(),
  maxFees: z.coerce.number().int().min(0).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  sort: z.enum(["rating", "fees", "name"]).optional().default("rating"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(9),
});

export type CollegeListQuery = z.infer<typeof collegeListQuerySchema>;

export const compareQuerySchema = z.object({
  ids: z
    .string()
    .min(1)
    .refine((v) => v.split(",").filter(Boolean).length >= 2 && v.split(",").filter(Boolean).length <= 3, {
      message: "Provide 2 to 3 college ids",
    }),
});

export type CompareQuery = z.infer<typeof compareQuerySchema>;

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(72),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

export type SignupInput = z.infer<typeof signupSchema>;
