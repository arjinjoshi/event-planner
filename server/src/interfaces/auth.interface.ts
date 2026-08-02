import { z } from "zod";
import {
  RegisterSchema,
  LoginSchema,
  VerifyEmailSchema,
  Verify2FAOtpSchema,
  RefreshTokenSchema,
  Toggle2FASchema,
  ChangePasswordSchema,
} from "../schemas/auth.schema";

// DTO Types inferred from Zod Schemas
export type RegisterDTO = z.infer<typeof RegisterSchema>;
export type LoginDTO = z.infer<typeof LoginSchema>;
export type VerifyEmailDTO = z.infer<typeof VerifyEmailSchema>;
export type Verify2FAOtpDTO = z.infer<typeof Verify2FAOtpSchema>;
export type RefreshTokenDTO = z.infer<typeof RefreshTokenSchema>;
export type Toggle2FADTO = z.infer<typeof Toggle2FASchema>;
export type ChangePasswordDTO = z.infer<typeof ChangePasswordSchema>;

// Response Interfaces
export interface UserResponse {
  id: string;
  email: string;
  name: string;
  phone_number?: string | null;
  avatar_url?: string | null;
  is_email_verified: boolean;
  is_two_factor_enabled: boolean;
  created_at: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: UserResponse;
  tokens?: TokenPair;
  requiresTwoFactor?: boolean;
}
