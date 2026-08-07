import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "../configurations/db";
import { config } from "../config";
import { TokenPayload } from "./auth.middleware";
import { ValidatedRequest, AuthUser } from "../interfaces/validatorRequest.interface";

export const optionalAuthenticate = async (
  req: ValidatedRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(); // Guest user: proceed without req.user
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return next();
    }

    let decoded: TokenPayload;
    try {
      decoded = jwt.verify(token, config.ACCESS_TOKEN_SECRET) as unknown as TokenPayload;
    } catch {
      return next(); // Invalid token: proceed as guest
    }

    const user = await db("users")
      .where({ id: decoded.userId })
      .select("id", "email", "name", "is_email_verified", "is_two_factor_enabled")
      .first();

    if (user) {
      req.user = user as AuthUser;
    }

    next();
  } catch (error) {
    next(error);
  }
};