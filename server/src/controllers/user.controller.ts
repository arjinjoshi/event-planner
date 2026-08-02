import { Response, NextFunction } from "express";
import { ValidatedRequest } from "../interfaces/validatorRequest.interface";
import { userService } from "../services/user.service";
import { successResponse } from "../utils/response";
import httpCodes from "../constants/httpCodes";
import { UpdateProfileInput, UserIdParam } from "../schemas/user.schema";
import { AppError } from "../utils/customError";

export const userController = {
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
