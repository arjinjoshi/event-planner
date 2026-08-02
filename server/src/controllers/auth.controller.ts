import { Response, NextFunction } from "express";
import { ValidatedRequest } from "../interfaces/validatorRequest.interface";
import { authService } from "../services/auth.service";
import { successResponse } from "../utils/response";
import httpCodes from "../constants/httpCodes";
import {
  RegisterDTO,
  LoginDTO,
  VerifyEmailDTO,
  Verify2FAOtpDTO,
  RefreshTokenDTO,
  ChangePasswordDTO,
  Toggle2FADTO,
} from "../interfaces/auth.interface";
import { AppError } from "../utils/customError";

export const authController = {
  /**
   * Register new user
   */
  register: async (
    req: ValidatedRequest<RegisterDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const file = req.file;
      const result = await authService.register(req.validated!.body!, file);

      return successResponse(res, {
        status: httpCodes.CREATED.statusCode,
        message:
          "Registration successful. Please check your email to verify your account.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Verify Email
   */
  verifyEmail: async (
    req: ValidatedRequest<VerifyEmailDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await authService.verifyEmail(req.validated!.body!);
      return successResponse(res, {
        status: httpCodes.OK.statusCode,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Login User
   */
  login: async (req: ValidatedRequest<LoginDTO>, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.validated!.body!);
      const message = result.requiresTwoFactor
        ? "2FA verification code sent to your email."
        : "Login successful.";

      return successResponse(res, {
        status: httpCodes.OK.statusCode,
        message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Verify 2FA OTP
   */
  verify2FAOtp: async (
    req: ValidatedRequest<Verify2FAOtpDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await authService.verify2FAOtp(req.validated!.body!);
      return successResponse(res, {
        status: httpCodes.OK.statusCode,
        message: "2FA verified successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Refresh Token
   */
  refreshToken: async (
    req: ValidatedRequest<RefreshTokenDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { refreshToken } = req.validated!.body!;
      const result = await authService.refreshToken(refreshToken);

      return successResponse(res, {
        status: httpCodes.OK.statusCode,
        message: "Tokens refreshed successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Toggle 2FA Setting
   */
  toggle2FA: async (
    req: ValidatedRequest<Toggle2FADTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", httpCodes.UNAUTHORIZED.statusCode);
      }

      const enable = req.validated?.body?.enable ?? req.body.enable;
      const result = await authService.toggleTwoFactor(req.user.id, Boolean(enable));

      return successResponse(res, {
        status: httpCodes.OK.statusCode,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Logout User
   */
  logout: async (
    req: ValidatedRequest<RefreshTokenDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const refreshToken = req.body?.refreshToken;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      return successResponse(res, {
        status: httpCodes.OK.statusCode,
        message: "Logged out successfully.",
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Change Password
   */
  changePassword: async (
    req: ValidatedRequest<ChangePasswordDTO>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized", httpCodes.UNAUTHORIZED.statusCode);
      }

      const result = await authService.changePassword(req.user.id, req.validated!.body!);

      return successResponse(res, {
        status: httpCodes.OK.statusCode,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },
};
