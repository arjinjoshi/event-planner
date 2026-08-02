import rateLimit from "express-rate-limit";
import { httpCodes } from "../constants/httpCodes";

/**
 * Standard API Limiter:
 * General protection for public read/write endpoints.
 * Allows 100 requests per 15 minutes.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per windowMs
  // Skip rate limiting if in development OR test mode
  skip: () => process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test",
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    status: httpCodes.TOO_MANY_REQUESTS.statusCode,
    message: "Too many requests, please try again later.",
  },
});

/**
 * Strict Auth Limiter:
 * Protects auth endpoints (Login, Register, Password Reset) against brute force.
 * Allows 5 requests per 15 minutes.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skip: () => process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test",
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    status: httpCodes.TOO_MANY_REQUESTS.statusCode,
    message: "Too many authentication attempts. Please try again in 15 minutes.",
  },
});
