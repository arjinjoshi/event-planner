import { z } from "zod";

/**
 * Schema for validating route parameters like /users/:id
 */
export const UserIdParamSchema = z.object({
  id: z.uuid({ message: "Invalid user ID format" }),
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

// Infer TypeScript types directly from Zod schemas for request Handlers
export type UserIdParam = z.infer<typeof UserIdParamSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
