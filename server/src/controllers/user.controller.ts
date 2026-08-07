import { Response, NextFunction } from "express";
import { ValidatedRequest } from "../interfaces/validatorRequest.interface";
import { userService } from "../services/user.service";
import { successResponse } from "../utils/response";
import httpCodes from "../constants/httpCodes";
import {
  UpdateProfileInput,
  UserIdParam,
  GetUsersQueryInput,
  GetUserEventsQueryInput,
} from "../schemas/user.schema";
import { AppError } from "../utils/customError";

export const userController = {
  /**
   * GET /users
   * Returns list of users with search, pagination, and event count per user
   */
  getAllUsers: async (
    req: ValidatedRequest<unknown, GetUsersQueryInput>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const rawQuery = (req.validated?.query || req.query) as Record<string, any>;

      const queryParams = {
        ...(rawQuery.page !== undefined && { page: Number(rawQuery.page) }),
        ...(rawQuery.limit !== undefined && { limit: Number(rawQuery.limit) }),
        ...(rawQuery.search ? { search: String(rawQuery.search) } : {}),
      };

      const result = await userService.getAllUsers(queryParams);

      return successResponse(res, {
        status: httpCodes.OK.statusCode,
        message: "Users retrieved successfully",
        data: result.data,
        meta: { pagination: result.pagination },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /users/:id/events
   * Returns all events created by a specific user with pagination
   */
  getUserEvents: async (
    req: ValidatedRequest<unknown, GetUserEventsQueryInput, UserIdParam>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = (req.validated?.params?.id || req.params.id) as string;
      const query = (req.validated?.query || req.query) as Record<string, any>;

      // Explicitly convert query values to numbers
      const page = query?.page !== undefined ? Number(query.page) : undefined;
      const limit = query?.limit !== undefined ? Number(query.limit) : undefined;

      const result = await userService.getUserEvents(userId, page, limit);

      // Pass pagination under meta
      return successResponse(res, {
        status: httpCodes.OK.statusCode,
        message: "User events retrieved successfully",
        data: result.data,
        meta: { pagination: result.pagination },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /users/me
   */
  getMe: async (req: ValidatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized access", httpCodes.UNAUTHORIZED.statusCode);
      }

      const user = await userService.getProfile(req.user.id);

      return successResponse(res, {
        status: httpCodes.OK.statusCode,
        message: "Profile retrieved successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /users/:id
   */
  getUserById: async (
    req: ValidatedRequest<unknown, unknown, UserIdParam>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId = (req.validated?.params?.id || req.params.id) as string;
      if (!userId) {
        throw new AppError("User ID is required", httpCodes.BAD_REQUEST.statusCode);
      }

      const user = await userService.getUserById(userId);

      return successResponse(res, {
        status: httpCodes.OK.statusCode,
        message: "User profile retrieved successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /users/me
   */
  updateProfile: async (
    req: ValidatedRequest<UpdateProfileInput>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized access", httpCodes.UNAUTHORIZED.statusCode);
      }

      const file = req.file;
      const updatedUser = await userService.updateProfile(
        req.user.id,
        req.validated?.body || req.body,
        file
      );

      return successResponse(res, {
        status: httpCodes.OK.statusCode,
        message: "Profile updated successfully",
        data: updatedUser,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /users/me/avatar
   */
  removeAvatar: async (req: ValidatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError("Unauthorized access", httpCodes.UNAUTHORIZED.statusCode);
      }

      const user = await userService.removeAvatar(req.user.id);

      return successResponse(res, {
        status: httpCodes.OK.statusCode,
        message: "Avatar removed successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },
};