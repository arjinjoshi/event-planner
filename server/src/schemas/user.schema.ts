import { z } from "zod";

/**
 * Schema for validating route parameters like /users/:id
 */
export const UserIdParamSchema = z.object({
  id: z.string().uuid({ message: "Invalid user ID format" }),
});

/**
 * Schema for validating profile updates via PATCH /users/me
 */
export const UpdateProfileSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" })
    .max(100, { message: "Name cannot exceed 100 characters" })
    .optional(),
  phone_number: z
    .string()
    .max(20, { message: "Phone number cannot exceed 20 characters" })
    .regex(/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/, {
      message: "Invalid phone number format",
    })
    .nullable()
    .optional(),
});

/**
 * Schema for validating query params on GET /users (pagination & search)
 */
export const GetUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
});

/**
 * for validating query params on GET /users/:id/events (pagination)
 */
export const GetUserEventsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

// Infer TypeScript types directly from Zod schemas
export type UserIdParam = z.infer<typeof UserIdParamSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
export type GetUsersQueryInput = z.infer<typeof GetUsersQuerySchema>;
export type GetUserEventsQueryInput = z.infer<typeof GetUserEventsQuerySchema>;