import { z } from "zod";

export const RegisterSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  name: z.string().min(2, "Name is required"),
  phone_number: z.string().optional().nullable(),
  avatar_url: z.url("Invalid URL").optional().nullable(),
});

export const LoginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const Toggle2FASchema = z.object({
  enable: z.boolean(),
});

export const VerifyEmailSchema = z.object({
  email: z.email("Invalid email address"),
  token: z.string().min(1, "Token is required"),
});

export const Verify2FAOtpSchema = z.object({
  userId: z.uuid("Invalid user ID"),
  code: z.string().length(6, "2FA code must be exactly 6 digits"),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

export const ChangePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Old password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters long"),
});
