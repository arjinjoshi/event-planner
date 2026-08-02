import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../configurations/db";
import { config } from "../config";
import { AppError } from "../utils/customError";
import httpCodes from "../constants/httpCodes";
import { ValidatedRequest, AuthUser } from "../interfaces/validatorRequest.interface";

export interface TokenPayload {
  userId: string;
  email: string;
  name: string;
  sessionId?: string;
  iat?: number;
  exp?: number;
}

/**
 * Authentication Guard: Verifies JWT access token and attaches user to request
 */
export const authenticate = async (
  req: ValidatedRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(
        "Access token missing or malformed",
        httpCodes.UNAUTHORIZED.statusCode
      );
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new AppError("Access token missing", httpCodes.UNAUTHORIZED.statusCode);
    }

    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET) as unknown as TokenPayload;
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        throw new AppError("Access token expired", httpCodes.UNAUTHORIZED.statusCode);
      }
      throw new AppError("Invalid access token", httpCodes.UNAUTHORIZED.statusCode);
    }

    const user = await db("users")
      .where({ id: decoded.userId })
      .select("id", "email", "name", "is_email_verified", "is_two_factor_enabled")
      .first();

    if (!user) {
      throw new AppError(
        "User account no longer exists",
        httpCodes.UNAUTHORIZED.statusCode
      );
    }

    req.user = user as AuthUser;

    next();
  } catch (error) {
    next(error);
  }
};