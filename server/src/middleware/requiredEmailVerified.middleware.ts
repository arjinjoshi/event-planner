import { Response, NextFunction } from "express";
import { ValidatedRequest } from "../interfaces/validatorRequest.interface";
import { AppError } from "../utils/customError";
import httpCodes from "../constants/httpCodes";

/**
 * Authorization Guard: Ensures the authenticated user has verified their email address
 */
export const requireEmailVerified = (
  req: ValidatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    throw new AppError("Authentication required", httpCodes.UNAUTHORIZED.statusCode);
  }

  if (!req.user.is_email_verified) {
    throw new AppError(
      "Please verify your email address before performing this action",
      httpCodes.FORBIDDEN.statusCode
    );
  }

  next();
};
