// src/middleware/validateRequest.ts
import { Response, NextFunction } from "express";
import { z } from "zod";
import type { Source, ValidatedRequest } from "../interfaces/validatorRequest.interface";
import { AppError } from "../utils/customError";
import httpCodes from "../constants/httpCodes";

export const validateRequest =
  (schema: z.ZodType<any>, source: Source = "body") =>
  (req: ValidatedRequest, _res: Response, next: NextFunction): void => {
    // Validate incoming data against chosen source (body, query, params, etc.)
    const result = schema.safeParse(req[source]);

    // Throw AppError on failure with mapped field paths & messages
    if (!result.success) {
      const formattedErrors = result.error.issues.map((item) => ({
        field: item.path.join(".") || source,
        message: item.message,
      }));

      throw new AppError(
        httpCodes.BAD_REQUEST.message,
        httpCodes.BAD_REQUEST.statusCode,
        formattedErrors
      );
    }

    // Attach strongly-typed validated data to req.validated
    if (!req.validated) {
      req.validated = {};
    }

    req.validated[source] = result.data;

    next();
  };
