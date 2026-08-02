import bcrypt from "bcrypt";
import { db } from "../configurations/db";
import { AppError } from "../utils/customError";
import httpCodes from "../constants/httpCodes";
import {
  createRefreshTokenSession,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/token";
import { NUMBER_OF_SALT_ROUNDS } from "../constants/auth";
import {
  RegisterDTO,
  LoginDTO,
  VerifyEmailDTO,
  Verify2FAOtpDTO,
  AuthResponse,
  UserResponse,
  ChangePasswordDTO,
} from "../interfaces/auth.interface";
import { uploadMedia } from "./cloudinary.service";
import { generateAndSend2FAOtp, sendVerificationToken } from "../utils/mailer";

export const authService = {
  /**
   * Register User (Handles optional avatar image upload to Cloudinary)
   */
  register: async (
    data: RegisterDTO,
    file?: Express.Multer.File
  ): Promise<AuthResponse> => {
    const { email, password, name, phone_number } = data;

    // Check uniqueness ONLY for email and phone_number
    const existingUser = await db("users")
      .where({ email })
      .modify((query) => {
        if (phone_number) query.orWhere({ phone_number });
      })
      .first();

    if (existingUser) {
      if (existingUser.email === email) {
        throw new AppError("Email already registered", httpCodes.BAD_REQUEST.statusCode);
      }
      if (phone_number && existingUser.phone_number === phone_number) {
        throw new AppError(
          "Phone number already registered",
          httpCodes.BAD_REQUEST.statusCode
        );
      }
    }

    let avatar_url = data.avatar_url || null;
    let avatar_public_id: string | null = null;

    if (file) {
      const uploadResult = await uploadMedia(file, "avatars");
      avatar_url = uploadResult.secure_url;
      avatar_public_id = uploadResult.public_id; // Capture Cloudinary public_id
    }

    const password_hash = await bcrypt.hash(password, NUMBER_OF_SALT_ROUNDS);

    return await db.transaction(async (trx) => {
      const [user] = await trx("users")
        .insert({
          email,
          password_hash,
          name,
          phone_number: phone_number || null,
          avatar_url,
          avatar_public_id, // Store in DB
          is_email_verified: false,
          is_two_factor_enabled: false,
        })
        .returning("*");

      const userResponse: UserResponse = {
        id: user.id,
        email: user.email,
        name: user.name,
        phone_number: user.phone_number,
        avatar_url: user.avatar_url,
        is_email_verified: user.is_email_verified,
        is_two_factor_enabled: user.is_two_factor_enabled,
        created_at: user.created_at,
      };

      await sendVerificationToken(user.id, user.email, trx);

      const session = await createRefreshTokenSession(user.id, trx);
      const accessToken = generateAccessToken(userResponse);
      const refreshToken = generateRefreshToken(userResponse, session.id);

      return {
        user: userResponse,
        tokens: { accessToken, refreshToken },
      };
    });
  },

  /**
   * Login User
   */
  login: async (data: LoginDTO): Promise<AuthResponse> => {
    const { email, password } = data;

    const user = await db("users").where({ email }).first();
    if (!user) {
      throw new AppError("Invalid email or password", httpCodes.UNAUTHORIZED.statusCode);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", httpCodes.UNAUTHORIZED.statusCode);
    }

    const userResponse: UserResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone_number: user.phone_number,
      avatar_url: user.avatar_url,
      is_email_verified: user.is_email_verified,
      is_two_factor_enabled: user.is_two_factor_enabled,
      created_at: user.created_at,
    };

    if (user.is_two_factor_enabled) {
      await generateAndSend2FAOtp(user.id, user.email);
      return {
        user: userResponse,
        requiresTwoFactor: true,
      };
    }

    const session = await createRefreshTokenSession(user.id);
    const accessToken = generateAccessToken(userResponse);
    const refreshToken = generateRefreshToken(userResponse, session.id);

    return {
      user: userResponse,
      tokens: { accessToken, refreshToken },
    };
  },

  /**
   * Verify Email 6-Digit OTP
   */
  verifyEmail: async ({ email, token }: VerifyEmailDTO) => {
    const user = await db("users").where({ email }).first();
    if (!user) {
      throw new AppError("User not found", httpCodes.NOT_FOUND.statusCode);
    }

    const verificationRecord = await db("email_verifications")
      .where({ user_id: user.id })
      .andWhere("expires_at", ">", new Date())
      .orderBy("created_at", "desc")
      .first();

    if (!verificationRecord) {
      throw new AppError(
        "Invalid or expired verification OTP",
        httpCodes.BAD_REQUEST.statusCode
      );
    }

    const isMatch = await bcrypt.compare(token, verificationRecord.token);
    if (!isMatch) {
      throw new AppError(
        "Invalid or expired verification OTP",
        httpCodes.BAD_REQUEST.statusCode
      );
    }

    await db("users").where({ id: user.id }).update({ is_email_verified: true });
    await db("email_verifications").where({ user_id: user.id }).delete();

    return { message: "Email verified successfully" };
  },

  /**
   * Toggle 2FA Setting
   */
  toggleTwoFactor: async (userId: string, enable: boolean) => {
    await db("users").where({ id: userId }).update({
      is_two_factor_enabled: enable,
      two_factor_secret: null,
    });

    return {
      message: `Two-Factor Authentication has been ${enable ? "enabled" : "disabled"}.`,
    };
  },

  /**
   * Verify 2FA OTP Code
   */
  verify2FAOtp: async ({ userId, code }: Verify2FAOtpDTO) => {
    const user = await db("users").where({ id: userId }).first();
    if (!user || !user.two_factor_secret) {
      throw new AppError("No 2FA code requested", httpCodes.BAD_REQUEST.statusCode);
    }

    const isValidOtp = await bcrypt.compare(code, user.two_factor_secret);
    if (!isValidOtp) {
      throw new AppError(
        "Invalid 2FA verification code",
        httpCodes.UNAUTHORIZED.statusCode
      );
    }

    await db("users").where({ id: userId }).update({ two_factor_secret: null });

    const userResponse: UserResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone_number: user.phone_number,
      avatar_url: user.avatar_url,
      is_email_verified: user.is_email_verified,
      is_two_factor_enabled: user.is_two_factor_enabled,
      created_at: user.created_at,
    };

    const session = await createRefreshTokenSession(user.id);
    const accessToken = generateAccessToken(userResponse);
    const refreshToken = generateRefreshToken(userResponse, session.id);

    return {
      user: userResponse,
      tokens: { accessToken, refreshToken },
    };
  },

  /**
   * Refresh Access Token
   */
  refreshToken: async (token: string) => {
    const payload = verifyRefreshToken(token);

    if (!payload || !payload.sessionId) {
      throw new AppError("Invalid refresh token", httpCodes.UNAUTHORIZED.statusCode);
    }

    const session = await db("refresh_tokens")
      .where({ id: payload.sessionId, is_revoked: false })
      .andWhere("expires_at", ">", new Date())
      .first();

    if (!session) {
      throw new AppError(
        "Refresh token revoked or expired",
        httpCodes.UNAUTHORIZED.statusCode
      );
    }

    await db("refresh_tokens").where({ id: session.id }).update({ is_revoked: true });

    const user = await db("users").where({ id: session.user_id }).first();
    if (!user) {
      throw new AppError(
        "User account no longer exists",
        httpCodes.UNAUTHORIZED.statusCode
      );
    }

    const userResponse: UserResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone_number: user.phone_number,
      avatar_url: user.avatar_url,
      is_email_verified: user.is_email_verified,
      is_two_factor_enabled: user.is_two_factor_enabled,
      created_at: user.created_at,
    };

    const newSession = await createRefreshTokenSession(user.id);
    const newAccessToken = generateAccessToken(userResponse);
    const newRefreshToken = generateRefreshToken(userResponse, newSession.id);

    return {
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    };
  },

  /**
   * Logout User
   */
  logout: async (token: string) => {
    try {
      const payload = verifyRefreshToken(token);
      if (payload && payload.sessionId) {
        await db("refresh_tokens")
          .where({ id: payload.sessionId })
          .update({ is_revoked: true });
      }
    } catch {
      // Ignored intentionally on invalid logout token
    }
    return { message: "Logout successful" };
  },

  /**
   * Change Password
   */
  changePassword: async (userId: string, data: ChangePasswordDTO) => {
    const { oldPassword, newPassword } = data;

    const user = await db("users").where({ id: userId }).first();
    if (!user) {
      throw new AppError("User not found", httpCodes.NOT_FOUND.statusCode);
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError("Incorrect old password", httpCodes.BAD_REQUEST.statusCode);
    }

    const newPasswordHash = await bcrypt.hash(newPassword, NUMBER_OF_SALT_ROUNDS);

    await db("users").where({ id: userId }).update({
      password_hash: newPasswordHash,
      updated_at: db.fn.now(),
    });

    await db("refresh_tokens").where({ user_id: userId }).update({ is_revoked: true });

    return { message: "Password updated successfully. Please log in again." };
  },
};
