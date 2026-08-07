import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/customError";
import { errorResponse } from "../utils/response";
import httpCodes from "../constants/httpCodes";
import { logger } from "../configurations/logger";

const { TokenExpiredError, JsonWebTokenError } = jwt;

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Fix: Ensure CORS headers are present on error responses
  const origin = req.headers.origin;
  const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");

  if (origin && (origin === clientUrl || origin === "http://localhost:5173")) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  // Handle Known App Errors (Validation, Auth failures, Not Found)
  if (err instanceof AppError) {
    logger.warn(`AppError [${err.status}]: ${err.message}`);

    return errorResponse(res, {
      status: err.status,
      message: err.message,
      code: "APP_ERROR",
      details: err.details,
    });
  }

  // Handle JWT Expired Token
  if (err instanceof TokenExpiredError) {
    logger.warn(`JWT Error [401]: Token has expired`);

    return errorResponse(res, {
      status: httpCodes.UNAUTHORIZED.statusCode,
      message: "Token has expired",
      code: "TOKEN_EXPIRED",
    });
  }

  // Handle JWT Malformed / Invalid Signature
  if (err instanceof JsonWebTokenError) {
    logger.warn(`JWT Error [401]: Invalid token signature`);

    return errorResponse(res, {
      status: httpCodes.UNAUTHORIZED.statusCode,
      message: "Invalid token signature",
      code: "INVALID_TOKEN",
    });
  }

  // Handle Unexpected System/Database Errors (500)
  logger.error(`Unhandled System Error: ${err.message}`, { stack: err.stack });

  return errorResponse(res, {
    status: httpCodes.INTERNAL_SERVER_ERROR.statusCode,
    message: "Internal Server Error",
    code: httpCodes.INTERNAL_SERVER_ERROR.message,
    details: process.env.NODE_ENV === "development" ? err.message : null,
  });
};