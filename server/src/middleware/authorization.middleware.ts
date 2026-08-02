import { Response, NextFunction } from "express";
import { db } from "../configurations/db";
import { AppError } from "../utils/customError";
import httpCodes from "../constants/httpCodes";
import { ValidatedRequest } from "../interfaces/validatorRequest.interface";

/**
 * Resource Ownership Guard
 * Ensures the authenticated user owns the target resource in the database.
 *
 * @param tableName Name of the DB table (e.g., 'events', 'event_rsvps')
 * @param ownerColumn Column storing the owner's UUID (default: 'creator_id')
 */
export const isOwner = (tableName: string, ownerColumn: string = "creator_id") => {
  return async (req: ValidatedRequest, _res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      const resourceId = req.params.id;

      if (!user) {
        throw new AppError("User not authenticated", httpCodes.UNAUTHORIZED.statusCode);
      }

      if (!resourceId) {
        throw new AppError(
          "Resource ID parameter missing",
          httpCodes.BAD_REQUEST.statusCode
        );
      }

      const resource = await db(tableName).where({ id: resourceId }).first();

      if (!resource) {
        throw new AppError("Resource not found", httpCodes.NOT_FOUND.statusCode);
      }

      if (resource[ownerColumn] !== user.id) {
        throw new AppError(
          "Forbidden: You do not have permission to modify or delete this resource",
          httpCodes.FORBIDDEN.statusCode
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
